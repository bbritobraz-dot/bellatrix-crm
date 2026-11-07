-- Bloqueia o acesso anônimo a todas as tabelas do schema public.
-- A chave "anon" fica exposta no navegador; sem RLS qualquer pessoa com ela
-- consegue ler/alterar/apagar os dados direto pela API do Supabase.
--
-- Depois desta migration, só usuários logados (Supabase Auth) acessam os dados.
-- Crie o(s) usuário(s) em: Supabase > Authentication > Users > Add user.
-- E desative cadastros públicos em: Authentication > Sign In / Providers > "Allow new users to sign up".

do $$
declare
  t record;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('drop policy if exists "authenticated_full_access" on public.%I', t.tablename);
    execute format(
      'create policy "authenticated_full_access" on public.%I for all to authenticated using (true) with check (true)',
      t.tablename
    );
  end loop;
end $$;
