-- Bellatrix CRM & Orçamentos - base inicial de custos
-- Banco sugerido: PostgreSQL / Supabase

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

create table if not exists quote_items (
  id bigserial primary key,
  quote_id bigint,
  product_id bigint references products(id),
  width_m numeric(10,3) not null,
  height_m numeric(10,3) not null,
  quantity int not null default 1,
  charged_area_m2 numeric(10,3),
  supplier_cost_total numeric(12,2),
  sale_price_total numeric(12,2),
  margin_percent numeric(10,2),
  created_at timestamptz not null default now()
);
