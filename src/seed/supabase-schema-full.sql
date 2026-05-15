-- Extensão para UUIDs (se necessário, embora Supabase já venha habilitado)
create extension if not exists "uuid-ossp";

-- PROFILES (Usuários Autenticados)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  role text default 'vendedor' check (role in ('admin', 'vendedor')),
  name text,
  created_at timestamptz not null default now()
);

-- CLIENTS
create table if not exists clients (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  phone text not null,
  email text,
  address text,
  neighborhood text,
  city text,
  lead_source text,
  status text not null default 'novo_lead' check (status in ('novo_lead', 'visita_agendada', 'visita_realizada', 'orcamento_enviado', 'em_negociacao', 'fechado', 'perdido', 'pos_venda')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- VISITS (Agenda)
create table if not exists visits (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid not null references clients(id) on delete cascade,
  responsible_id uuid references profiles(id),
  date date not null,
  time time not null,
  address text,
  status text not null default 'agendada' check (status in ('agendada', 'confirmada', 'realizada', 'reagendada', 'cancelada')),
  notes text,
  created_at timestamptz not null default now()
);

-- ==========================================
-- PRODUTOS (Baseado no schema original)
-- ==========================================
create table if not exists product_lines (
  id text primary key,
  label text not null,
  min_area_m2 numeric(10,2),
  max_width_m numeric(10,2),
  base_formula text not null,
  notes text
);

create table if not exists products (
  id bigint primary key,
  sku text unique not null,
  line text not null references product_lines(id),
  subgroup text,
  name text not null,
  slug text unique not null,
  colors text,
  cost_unit text not null check (cost_unit in ('m2','linear_m','unit')),
  supplier_cost numeric(12,2),
  max_width_m numeric(10,2),
  active boolean not null default true,
  source_sheet text,
  source_row int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists accessories (
  id bigint primary key,
  sku text unique not null,
  line text not null references product_lines(id),
  name text not null,
  slug text unique not null,
  cost_unit text not null check (cost_unit in ('linear_m','unit','m2')),
  supplier_cost numeric(12,2),
  min_quantity numeric(10,2),
  max_quantity numeric(10,2),
  calculation_formula text not null,
  active boolean not null default true,
  source_sheet text,
  source_row int,
  notes text
);

create table if not exists reforms (
  id bigint primary key,
  category text not null,
  name text not null,
  slug text unique not null,
  cost_unit text not null,
  supplier_cost numeric(12,2),
  active boolean not null default true,
  source_sheet text,
  source_row int,
  notes text
);

-- ==========================================
-- ORÇAMENTOS
-- ==========================================
create table if not exists quotes (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid not null references clients(id) on delete cascade,
  responsible_id uuid references profiles(id),
  status text not null default 'rascunho' check (status in ('rascunho', 'enviado', 'aprovado', 'recusado', 'expirado')),
  validity_days int default 15,
  default_margin_percent numeric(10,2) default 0,
  discount_amount numeric(12,2) default 0,
  discount_percent numeric(10,2) default 0,
  total_supplier_cost numeric(12,2) default 0,
  total_sale_price numeric(12,2) default 0,
  estimated_profit numeric(12,2) default 0,
  loss_reason text,
  payment_conditions text,
  commercial_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quote_items (
  id uuid default uuid_generate_v4() primary key,
  quote_id uuid not null references quotes(id) on delete cascade,
  product_id bigint references products(id),
  width_m numeric(10,3) not null,
  height_m numeric(10,3) not null,
  quantity int not null default 1,
  charged_area_m2 numeric(10,3),
  supplier_cost_total numeric(12,2),
  sale_price_total numeric(12,2),
  margin_percent numeric(10,2),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists quote_item_accessories (
  id uuid default uuid_generate_v4() primary key,
  quote_item_id uuid not null references quote_items(id) on delete cascade,
  accessory_id bigint references accessories(id),
  quantity numeric(10,3) not null default 1,
  supplier_cost_total numeric(12,2),
  sale_price_total numeric(12,2)
);

create table if not exists quote_reforms (
  id uuid default uuid_generate_v4() primary key,
  quote_id uuid not null references quotes(id) on delete cascade,
  reform_id bigint references reforms(id),
  description text,
  quantity numeric(10,3) not null default 1,
  supplier_cost_total numeric(12,2),
  sale_price_total numeric(12,2)
);

create table if not exists quote_status_history (
  id uuid default uuid_generate_v4() primary key,
  quote_id uuid not null references quotes(id) on delete cascade,
  status text not null,
  changed_by uuid references profiles(id),
  reason text,
  created_at timestamptz not null default now()
);
