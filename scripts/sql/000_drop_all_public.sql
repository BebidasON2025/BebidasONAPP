-- Apaga todas as policies e todas as tabelas do schema public (idempotente)
-- Rode no Supabase SQL Editor (role: postgres).

do $$
declare r record;
begin
  -- Remove policies existentes
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;

  -- Remove todas as tabelas do schema public
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('drop table if exists public.%I cascade', r.tablename);
  end loop;

  -- Remove funções conhecidas usadas pelos gatilhos (se existirem)
  if exists (select 1 from pg_proc where proname = 'set_atualizado_em') then
    execute 'drop function public.set_atualizado_em() cascade';
  end if;
  if exists (select 1 from pg_proc where proname = 'on_pedido_pago') then
    execute 'drop function public.on_pedido_pago() cascade';
  end if;
  if exists (select 1 from pg_proc where proname = 'on_fiado_pago') then
    execute 'drop function public.on_fiado_pago() cascade';
  end if;
end $$;
