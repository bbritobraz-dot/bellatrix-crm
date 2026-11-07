-- Dinheiro sempre em centavos.
-- As colunas de valor eram "numeric" sem escala e guardavam sobras de ponto
-- flutuante do navegador (ex.: 223,20000000000005). Com numeric(12,2) o banco
-- arredonda automaticamente para 2 casas em toda gravação.
alter table public.quotes
  alter column total_sale_price type numeric(12,2) using round(total_sale_price, 2),
  alter column total_paid type numeric(12,2) using round(total_paid, 2),
  alter column supplier_cost_total type numeric(12,2) using round(supplier_cost_total, 2),
  alter column supplier_paid type numeric(12,2) using round(supplier_paid, 2),
  alter column discount_amount type numeric(12,2) using round(discount_amount, 2),
  alter column total_supplier_cost type numeric(12,2) using round(total_supplier_cost, 2),
  alter column estimated_profit type numeric(12,2) using round(estimated_profit, 2);

alter table public.quote_items
  alter column supplier_cost_total type numeric(12,2) using round(supplier_cost_total, 2),
  alter column sale_price_total type numeric(12,2) using round(sale_price_total, 2);

alter table public.quote_item_accessories
  alter column supplier_cost_total type numeric(12,2) using round(supplier_cost_total, 2),
  alter column sale_price_total type numeric(12,2) using round(sale_price_total, 2);

alter table public.payments
  alter column amount type numeric(12,2) using round(amount, 2);

alter table public.expenses
  alter column amount type numeric(12,2) using round(amount, 2),
  alter column paid_amount type numeric(12,2) using round(paid_amount, 2);

alter table public.bank_accounts
  alter column balance type numeric(12,2) using round(balance, 2);
