-- Atualização atômica de saldo bancário.
-- Antes o app lia o saldo, somava no servidor e gravava de volta: duas operações
-- ao mesmo tempo (ex.: dois pagamentos) faziam uma sobrescrever a outra.

create or replace function public.adjust_bank_balance(p_account_id uuid, p_delta numeric)
returns numeric
language plpgsql
security invoker
as $$
declare
  new_balance numeric;
begin
  update public.bank_accounts
     set balance = coalesce(balance, 0) + p_delta,
         updated_at = now()
   where id = p_account_id
  returning balance into new_balance;

  if not found then
    raise exception 'Conta bancária % não encontrada', p_account_id;
  end if;

  return new_balance;
end;
$$;

-- Transferência entre contas em uma única transação (ou as duas mudam, ou nenhuma).
create or replace function public.transfer_bank_funds(p_from uuid, p_to uuid, p_amount numeric)
returns void
language plpgsql
security invoker
as $$
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Valor deve ser maior que zero';
  end if;
  if p_from = p_to then
    raise exception 'Escolha contas diferentes';
  end if;

  perform public.adjust_bank_balance(p_from, -p_amount);
  perform public.adjust_bank_balance(p_to, p_amount);
end;
$$;

revoke execute on function public.adjust_bank_balance(uuid, numeric) from anon, public;
revoke execute on function public.transfer_bank_funds(uuid, uuid, numeric) from anon, public;
grant execute on function public.adjust_bank_balance(uuid, numeric) to authenticated;
grant execute on function public.transfer_bank_funds(uuid, uuid, numeric) to authenticated;
