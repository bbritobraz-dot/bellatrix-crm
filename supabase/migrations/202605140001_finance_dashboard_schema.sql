create extension if not exists "uuid-ossp";

create table if not exists bank_accounts (
  id uuid default uuid_generate_v4() primary key,
  bank_name text not null,
  account_label text,
  balance numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists expense_categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);

insert into expense_categories (name, is_custom)
values
  ('Custo de Produtos', false),
  ('Operacional', false),
  ('Marketing', false),
  ('Administrativo', false)
on conflict (name) do nothing;

create table if not exists expenses (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references expense_categories(id),
  description text not null,
  amount numeric(12,2) not null default 0,
  date timestamptz not null default now(),
  due_date timestamptz,
  payment_method text,
  notes text,
  is_paid boolean not null default false,
  paid_date timestamptz,
  paid_amount numeric(12,2),
  paid_method text,
  bank_account_id uuid references bank_accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid default uuid_generate_v4() primary key,
  quote_id uuid references quotes(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  amount numeric(12,2) not null default 0,
  payment_method text not null,
  payment_date timestamptz not null default now(),
  notes text,
  is_manual boolean not null default false,
  manual_description text,
  bank_account_id uuid references bank_accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table quotes add column if not exists total_paid numeric(12,2) not null default 0;
alter table quotes add column if not exists supplier_cost_total numeric(12,2) not null default 0;
alter table quotes add column if not exists supplier_paid numeric(12,2) not null default 0;
alter table quotes add column if not exists payment_due_date timestamptz;
alter table quotes add column if not exists supplier_payment_deadline timestamptz;
alter table quotes add column if not exists production_start_date timestamptz;
alter table quotes add column if not exists delivery_forecast_date timestamptz;
alter table quotes add column if not exists installation_date timestamptz;
alter table quotes add column if not exists warranty_end_date timestamptz;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'quotes_status_check'
      and conrelid = 'quotes'::regclass
  ) then
    alter table quotes drop constraint quotes_status_check;
  end if;

  alter table quotes add constraint quotes_status_check
    check (status in (
      'rascunho',
      'enviado',
      'aprovado',
      'recusado',
      'expirado',
      'em_producao',
      'pronto_para_instalacao',
      'finalizado'
    ));
end $$;
