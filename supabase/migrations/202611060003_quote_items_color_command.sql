-- Cor e comando de cada item eram exibidos no formulário/PDF mas nunca gravados:
-- ao reabrir ou editar um orçamento essas informações se perdiam.
alter table public.quote_items add column if not exists color text;
alter table public.quote_items add column if not exists command_side text;
alter table public.quote_items add column if not exists command_height_m numeric(10,3);
