-- Fixa o search_path das funções (aviso de segurança do Supabase:
-- "function_search_path_mutable"). Todas as referências já usam "public.".
do $$
declare
  f text;
begin
  foreach f in array array[
    'adjust_bank_balance(uuid, numeric)',
    'transfer_bank_funds(uuid, uuid, numeric)',
    'quote_short_code(uuid)',
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
    execute format('alter function public.%s set search_path = ''''', f);
  end loop;
end $$;
