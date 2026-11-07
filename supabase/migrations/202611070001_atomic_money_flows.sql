-- =====================================================================
-- Operações de dinheiro atômicas + estorno + campos novos
--
-- Antes, cada operação (pagamento, adiantamento à fábrica, despesa...) era
-- gravada em vários passos separados pelo app. Se a conexão caísse no meio,
-- ficava, por exemplo, o pagamento registrado sem atualizar o saldo.
-- Agora cada operação é UMA função no banco: ou tudo é gravado, ou nada.
--
-- Depende de: 202611060002_atomic_bank_balance.sql (adjust_bank_balance)
-- =====================================================================

-- ---------- Colunas novas ----------
-- Ambiente do item (Sala, Quarto 01...), usado no PDF e no pedido de fábrica
alter table public.quote_items add column if not exists ambient text;

-- Data de alteração das despesas (não existia em produção; usada na quitação)
alter table public.expenses add column if not exists updated_at timestamptz default now();

-- Parcelas do cartão (já existe em produção; garante em bancos novos)
alter table public.payments add column if not exists installments int;

-- Vínculos para permitir estorno preciso
alter table public.expenses add column if not exists quote_id uuid references public.quotes(id) on delete set null;
alter table public.expenses add column if not exists payment_id uuid references public.payments(id) on delete set null;
create index if not exists expenses_quote_id_idx on public.expenses(quote_id);
create index if not exists expenses_payment_id_idx on public.expenses(payment_id);
create index if not exists payments_quote_id_idx on public.payments(quote_id);

-- ---------- Auxiliares ----------
create or replace function public.get_or_create_expense_category(p_name text)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_id uuid;
begin
  -- (no banco de produção o nome não tem restrição UNIQUE, então não dá para usar ON CONFLICT)
  select id into v_id from public.expense_categories where name = p_name order by created_at nulls last limit 1;
  if v_id is null then
    insert into public.expense_categories (name, is_custom) values (p_name, true)
    returning id into v_id;
  end if;
  return v_id;
end;
$$;

-- Código curto do pedido usado nas descrições antigas ("Pedido A1B2C3D4")
create or replace function public.quote_short_code(p_quote_id uuid)
returns text
language sql
immutable
as $$ select upper(split_part(p_quote_id::text, '-', 1)) $$;

-- ---------- Recebimento do cliente ----------
create or replace function public.register_payment(
  p_amount numeric,
  p_method text,
  p_bank uuid,
  p_quote_id uuid default null,
  p_client_id uuid default null,
  p_notes text default null,
  p_installments int default null,
  p_is_manual boolean default false,
  p_manual_description text default null,
  p_payment_date timestamptz default null
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_total numeric;
  v_paid numeric;
  v_quote_client uuid;
  v_pending numeric;
  v_fee_percent numeric := 0;
  v_fee numeric := 0;
  v_payment_id uuid;
  v_is_debit boolean := p_method = 'Cartão de Débito';
  v_is_credit boolean := p_method = 'Cartão de Crédito';
  v_when timestamptz := coalesce(p_payment_date, now());
  v_notes text := p_notes;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Valor deve ser maior que zero';
  end if;
  if p_bank is null then
    raise exception 'Selecione a conta bancária';
  end if;

  if p_quote_id is not null then
    -- trava o pedido para dois recebimentos simultâneos não passarem do total
    select total_sale_price, total_paid, client_id into v_total, v_paid, v_quote_client
      from public.quotes where id = p_quote_id for update;
    if not found then
      raise exception 'Pedido não encontrado';
    end if;
    v_pending := greatest(coalesce(v_total, 0) - coalesce(v_paid, 0), 0);
    if p_amount > v_pending + 0.009 then
      raise exception 'Valor maior que o saldo devedor (R$ %)', replace(to_char(v_pending, 'FM999999990.00'), '.', ',');
    end if;
  end if;

  -- taxa da maquininha
  if v_is_debit or (v_is_credit and p_installments is not null) then
    select fee_percent into v_fee_percent
      from public.card_fee_settings
     where installments = case when v_is_debit then 0 else p_installments end
     limit 1;
    v_fee := round(p_amount * coalesce(v_fee_percent, 0) / 100, 2);
  end if;

  if v_is_credit and p_installments is not null then
    v_notes := trim(coalesce(p_notes, '') || ' (Parcelado em ' || p_installments || 'x)');
  end if;

  insert into public.payments (quote_id, client_id, amount, payment_method, payment_date, notes, is_manual, manual_description, bank_account_id, installments)
  values (p_quote_id, coalesce(p_client_id, v_quote_client), p_amount, p_method, v_when, v_notes, coalesce(p_is_manual, false), p_manual_description, p_bank,
          case when v_is_credit then coalesce(p_installments, 1) else 1 end)
  returning id into v_payment_id;

  if v_fee > 0 then
    insert into public.expenses (category_id, description, amount, date, is_paid, paid_date, paid_amount, paid_method, bank_account_id, notes, quote_id, payment_id)
    values (
      public.get_or_create_expense_category('Taxas de Cartão'),
      'Taxa de Cartão (' || case when v_is_debit then 'Débito' else 'Crédito' end || ') - Ref. ' ||
        coalesce(lower(split_part(p_quote_id::text, '-', 1)), 'Manual'),
      v_fee, v_when, true, v_when, v_fee, p_method, p_bank,
      'Taxa de ' || v_fee_percent || '% sobre R$ ' || p_amount ||
        case when v_is_debit then ' (Débito)' else ' (' || p_installments || 'x)' end,
      p_quote_id, v_payment_id
    );
  end if;

  perform public.adjust_bank_balance(p_bank, p_amount - v_fee);

  if p_quote_id is not null then
    update public.quotes
       set total_paid = coalesce(total_paid, 0) + p_amount, updated_at = now()
     where id = p_quote_id;
  end if;

  return v_payment_id;
end;
$$;

-- ---------- Pagamento à fábrica ----------
create or replace function public.pay_supplier(
  p_quote_id uuid,
  p_amount numeric,
  p_method text,
  p_bank uuid,
  p_description text default null
)
returns void
language plpgsql
security invoker
as $$
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Valor deve ser maior que zero';
  end if;
  if p_bank is null then
    raise exception 'Selecione a conta bancária';
  end if;

  update public.quotes
     set supplier_paid = coalesce(supplier_paid, 0) + p_amount, updated_at = now()
   where id = p_quote_id;
  if not found then
    raise exception 'Pedido não encontrado';
  end if;

  insert into public.expenses (category_id, description, amount, date, payment_method, is_paid, paid_date, paid_amount, paid_method, bank_account_id, quote_id)
  values (
    public.get_or_create_expense_category('Custo de Produtos'),
    coalesce(p_description, 'Pagamento Fornecedor - Pedido ' || public.quote_short_code(p_quote_id)),
    p_amount, now(), p_method, true, now(), p_amount, p_method, p_bank, p_quote_id
  );

  perform public.adjust_bank_balance(p_bank, -p_amount);
end;
$$;

-- ---------- Enviar para produção ----------
create or replace function public.move_to_production(
  p_quote_id uuid,
  p_forecast timestamptz,
  p_supplier_deadline timestamptz,
  p_supplier_cost numeric default null,
  p_supplier_paid numeric default 0,
  p_method text default null,
  p_bank uuid default null
)
returns void
language plpgsql
security invoker
as $$
declare
  v_client uuid;
begin
  update public.quotes
     set status = 'em_producao',
         production_start_date = now(),
         delivery_forecast_date = p_forecast,
         supplier_payment_deadline = p_supplier_deadline,
         -- saldo do cliente vence na entrega (50% na entrega), salvo se já definido
         payment_due_date = coalesce(payment_due_date, p_forecast),
         supplier_cost_total = coalesce(p_supplier_cost, supplier_cost_total),
         updated_at = now()
   where id = p_quote_id
  returning client_id into v_client;

  if not found then
    raise exception 'Pedido não encontrado';
  end if;

  if v_client is not null then
    update public.clients set status = 'fechado' where id = v_client;
  end if;

  if coalesce(p_supplier_paid, 0) > 0 then
    -- soma ao que já foi pago (antes sobrescrevia e perdia adiantamentos anteriores)
    perform public.pay_supplier(
      p_quote_id, p_supplier_paid, coalesce(p_method, 'a definir'), p_bank,
      'Entrada/Sinal Fornecedor - Pedido ' || public.quote_short_code(p_quote_id)
    );
  end if;
end;
$$;

-- ---------- Finalizar obra (com recebimento opcional do saldo) ----------
create or replace function public.finish_order(
  p_quote_id uuid,
  p_amount numeric default 0,
  p_method text default null,
  p_bank uuid default null,
  p_installments int default null
)
returns void
language plpgsql
security invoker
as $$
declare
  v_client uuid;
begin
  if coalesce(p_amount, 0) > 0 then
    perform public.register_payment(
      p_amount, p_method, p_bank, p_quote_id, null,
      'Pagamento na instalação (finalização)', p_installments
    );
  end if;

  update public.quotes
     set status = 'finalizado',
         installation_date = now(),
         warranty_end_date = now() + interval '1 year',
         updated_at = now()
   where id = p_quote_id
  returning client_id into v_client;

  if not found then
    raise exception 'Pedido não encontrado';
  end if;

  if v_client is not null then
    update public.clients set status = 'pos_venda' where id = v_client;
  end if;
end;
$$;

-- ---------- Despesas ----------
create or replace function public.create_paid_expense(
  p_category uuid,
  p_description text,
  p_amount numeric,
  p_bank uuid,
  p_method text default null,
  p_date timestamptz default null,
  p_due_date timestamptz default null,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_id uuid;
  v_when timestamptz := coalesce(p_date, now());
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Valor deve ser maior que zero';
  end if;
  if p_bank is null then
    raise exception 'Selecione a conta bancária';
  end if;

  insert into public.expenses (category_id, description, amount, date, due_date, payment_method, notes, is_paid, paid_date, paid_amount, paid_method, bank_account_id)
  values (p_category, p_description, p_amount, v_when, p_due_date, p_method, p_notes, true, v_when, p_amount, p_method, p_bank)
  returning id into v_id;

  perform public.adjust_bank_balance(p_bank, -p_amount);
  return v_id;
end;
$$;

create or replace function public.delete_expense(p_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_exp record;
begin
  select * into v_exp from public.expenses where id = p_id for update;
  if not found then
    raise exception 'Despesa não encontrada';
  end if;

  delete from public.expenses where id = p_id;

  if v_exp.is_paid and v_exp.bank_account_id is not null then
    -- devolve o que realmente saiu da conta
    perform public.adjust_bank_balance(v_exp.bank_account_id, coalesce(v_exp.paid_amount, v_exp.amount));

    -- se era pagamento à fábrica, desconta também do "pago ao fornecedor" do pedido
    if v_exp.quote_id is not null
       and v_exp.category_id in (select id from public.expense_categories where name = 'Custo de Produtos') then
      update public.quotes
         set supplier_paid = greatest(coalesce(supplier_paid, 0) - coalesce(v_exp.paid_amount, v_exp.amount), 0)
       where id = v_exp.quote_id;
    end if;
  end if;
end;
$$;

-- Quita uma despesa em aberto; pagamento parcial mantém o restante em aberto.
-- Retorna o valor que continua em aberto (0 se quitada).
create or replace function public.liquidate_expense(
  p_id uuid,
  p_amount numeric,
  p_method text,
  p_bank uuid
)
returns numeric
language plpgsql
security invoker
as $$
declare
  v_exp record;
  v_remaining numeric;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Valor deve ser maior que zero';
  end if;
  if p_bank is null then
    raise exception 'Selecione a conta bancária';
  end if;

  select * into v_exp from public.expenses where id = p_id for update;
  if not found then
    raise exception 'Despesa não encontrada';
  end if;
  if v_exp.is_paid then
    raise exception 'Esta despesa já foi paga';
  end if;

  v_remaining := round(v_exp.amount - p_amount, 2);

  if v_remaining > 0 then
    insert into public.expenses (category_id, description, amount, date, due_date, payment_method, notes, is_paid, paid_date, paid_amount, paid_method, bank_account_id, quote_id)
    values (v_exp.category_id, v_exp.description || ' (parcial)', p_amount, now(), v_exp.due_date, p_method, v_exp.notes, true, now(), p_amount, p_method, p_bank, v_exp.quote_id);
    update public.expenses set amount = v_remaining, updated_at = now() where id = p_id;
  else
    update public.expenses
       set is_paid = true, paid_date = now(), paid_amount = p_amount, paid_method = p_method,
           bank_account_id = p_bank, updated_at = now()
     where id = p_id;
  end if;

  perform public.adjust_bank_balance(p_bank, -p_amount);
  return greatest(v_remaining, 0);
end;
$$;

-- ---------- Estorno de tudo que foi pago/recebido num pedido ----------
create or replace function public.reverse_quote_payments(p_quote_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_code text := public.quote_short_code(p_quote_id);
  r record;
begin
  perform 1 from public.quotes where id = p_quote_id for update;
  if not found then
    raise exception 'Pedido não encontrado';
  end if;

  -- 1) Recebimentos do cliente: tira o valor bruto da conta...
  for r in select id, amount, bank_account_id from public.payments where quote_id = p_quote_id loop
    if r.bank_account_id is not null then
      perform public.adjust_bank_balance(r.bank_account_id, -r.amount);
    end if;
  end loop;

  -- ...e devolve as taxas de cartão (que já tinham sido descontadas do líquido)
  for r in
    select id, coalesce(paid_amount, amount) as val, bank_account_id from public.expenses
     where payment_id in (select id from public.payments where quote_id = p_quote_id)
        or (payment_id is null and quote_id is null
            and category_id in (select id from public.expense_categories where name = 'Taxas de Cartão')
            and description ilike '%Ref. ' || lower(v_code) || '%')
  loop
    if r.bank_account_id is not null then
      perform public.adjust_bank_balance(r.bank_account_id, r.val);
    end if;
    delete from public.expenses where id = r.id;
  end loop;

  delete from public.payments where quote_id = p_quote_id;

  -- 2) Pagamentos à fábrica: devolve para a conta e apaga a despesa
  for r in
    select id, coalesce(paid_amount, amount) as val, bank_account_id from public.expenses
     where is_paid
       and category_id in (select id from public.expense_categories where name = 'Custo de Produtos')
       and (quote_id = p_quote_id
            or (quote_id is null and description ilike '%Pedido ' || v_code || '%'))
  loop
    if r.bank_account_id is not null then
      perform public.adjust_bank_balance(r.bank_account_id, r.val);
    end if;
    delete from public.expenses where id = r.id;
  end loop;

  update public.quotes set total_paid = 0, supplier_paid = 0, updated_at = now() where id = p_quote_id;
end;
$$;

-- ---------- Reabrir pedido ----------
create or replace function public.reopen_quote(p_quote_id uuid, p_reverse_payments boolean default false)
returns void
language plpgsql
security invoker
as $$
declare
  v_client uuid;
begin
  if p_reverse_payments then
    perform public.reverse_quote_payments(p_quote_id);
  end if;

  update public.quotes
     set status = 'rascunho',
         production_start_date = null,
         delivery_forecast_date = null,
         installation_date = null,
         warranty_end_date = null,
         updated_at = now()
   where id = p_quote_id
  returning client_id into v_client;

  if not found then
    raise exception 'Pedido não encontrado';
  end if;

  if v_client is not null then
    update public.clients set status = 'em_negociacao' where id = v_client and status in ('fechado', 'pos_venda');
  end if;
end;
$$;

-- ---------- Excluir orçamento (bloqueado se houver pagamentos) ----------
create or replace function public.delete_quote(p_quote_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_quote record;
begin
  select total_paid, supplier_paid into v_quote from public.quotes where id = p_quote_id for update;
  if not found then
    raise exception 'Orçamento não encontrado';
  end if;

  if coalesce(v_quote.total_paid, 0) > 0
     or coalesce(v_quote.supplier_paid, 0) > 0
     or exists (select 1 from public.payments where quote_id = p_quote_id)
     or exists (select 1 from public.expenses where quote_id = p_quote_id) then
    raise exception 'Este orçamento tem pagamentos registrados. Reabra-o estornando os pagamentos antes de excluir.';
  end if;

  delete from public.quotes where id = p_quote_id; -- itens e acessórios saem em cascata
end;
$$;

-- ---------- Permissões: só usuários logados ----------
do $$
declare
  f text;
begin
  foreach f in array array[
    'get_or_create_expense_category(text)',
    'register_payment(numeric, text, uuid, uuid, uuid, text, int, boolean, text, timestamptz)',
    'pay_supplier(uuid, numeric, text, uuid, text)',
    'move_to_production(uuid, timestamptz, timestamptz, numeric, numeric, text, uuid)',
    'finish_order(uuid, numeric, text, uuid, int)',
    'create_paid_expense(uuid, text, numeric, uuid, text, timestamptz, timestamptz, text)',
    'delete_expense(uuid)',
    'liquidate_expense(uuid, numeric, text, uuid)',
    'reverse_quote_payments(uuid)',
    'reopen_quote(uuid, boolean)',
    'delete_quote(uuid)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
