-- =========================================================
-- 000_setup_ptbr_singular.sql
-- Reset completo + instalação PT-BR (nomes singulares)
-- Tabelas: estoque, cliente, fornecedor, lancamento_financeiro,
--          pedido, item_pedido, nota_fiscal, comprovante_fiado, item_fiado
-- Inclui: índices, triggers, RLS habilitado + policies DEV abertas,
--         e seeds de demonstração.
-- Seguro para re-executar.
-- =========================================================

begin;

-- Extensões
create extension if not exists "pgcrypto";

-- DROP completo (ordem para respeitar FKs)
-- Novos nomes (singular)
drop table if exists item_pedido cascade;
drop table if exists pedido cascade;
drop table if exists lancamento_financeiro cascade;
drop table if exists nota_fiscal cascade;
drop table if exists item_fiado cascade;
drop table if exists comprovante_fiado cascade;
drop table if exists estoque cascade;
drop table if exists cliente cascade;
drop table if exists fornecedor cascade;

-- Legado PT-BR plural
drop table if exists itens_pedido cascade;
drop table if exists pedidos cascade;
drop table if exists lancamentos_financeiros cascade;
drop table if exists notas_fiscais cascade;
drop table if exists itens_fiado cascade;
drop table if exists comprovantes_fiado cascade;
drop table if exists produtos cascade;
drop table if exists clientes cascade;
drop table if exists fornecedores cascade;

-- Legado inglês
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists finance_entries cascade;
drop table if exists invoices cascade;
drop table if exists fiado_items cascade;
drop table if exists fiado_receipts cascade;
drop table if exists products cascade;
drop table if exists customers cascade;
drop table if exists suppliers cascade;

-- Funções/triggers conhecidas
do $$
begin
if exists (select 1 from pg_proc where proname = 'set_atualizado_em') then
  drop function set_atualizado_em() cascade;
end if;
if exists (select 1 from pg_proc where proname = 'on_pedido_pago') then
  drop function on_pedido_pago() cascade;
end if;
if exists (select 1 from pg_proc where proname = 'on_fiado_pago') then
  drop function on_fiado_pago() cascade;
end if;

if exists (select 1 from pg_proc where proname = 'set_updated_at') then
  drop function set_updated_at() cascade;
end if;
if exists (select 1 from pg_proc where proname = 'on_order_paid') then
  drop function on_order_paid() cascade;
end if;
if exists (select 1 from pg_proc where proname = 'on_fiado_paid') then
  drop function on_fiado_paid() cascade;
end if;
end $$;

commit;

-- ===============================
-- [ESTOQUE] (produtos)
-- ===============================
create table if not exists public.estoque (
id uuid primary key default gen_random_uuid(),
nome text not null,
categoria text,
preco numeric(12,2) not null default 0,
estoque integer not null default 0,
alerta_estoque integer not null default 0,
codigo_barras text,
criado_em timestamptz not null default now(),
atualizado_em timestamptz not null default now()
);

-- ===============================
-- [CLIENTE]
-- ===============================
create table if not exists public.cliente (
id uuid primary key default gen_random_uuid(),
nome text not null,
email text,
telefone text,
total_gasto numeric(12,2) not null default 0,
criado_em timestamptz not null default now(),
atualizado_em timestamptz not null default now()
);

-- ===============================
-- [FORNECEDOR]
-- ===============================
create table if not exists public.fornecedor (
id uuid primary key default gen_random_uuid(),
nome text not null,
email text,
telefone text,
cnpj text,
criado_em timestamptz not null default now(),
atualizado_em timestamptz not null default now()
);

-- ===============================
-- [LANÇAMENTO FINANCEIRO]
-- ===============================
create table if not exists public.lancamento_financeiro (
id uuid primary key default gen_random_uuid(),
tipo text not null check (tipo in ('entrada','saida')),
descricao text not null,
categoria text not null,
valor numeric(12,2) not null default 0,
metodo text not null,
data timestamptz not null default now(),
criado_em timestamptz not null default now()
);

-- ===============================
-- [PEDIDO]
-- ===============================
create table if not exists public.pedido (
id uuid primary key default gen_random_uuid(),
cliente_id uuid references public.cliente(id) on delete set null,
metodo text not null,
status text not null check (status in ('novo','pendente','pago','cancelado')) default 'novo',
total numeric(12,2) not null default 0,
data timestamptz not null default now(),
criado_em timestamptz not null default now(),
atualizado_em timestamptz not null default now()
);

-- ===============================
-- [ITEM PEDIDO]
-- ===============================
create table if not exists public.item_pedido (
id uuid primary key default gen_random_uuid(),
pedido_id uuid not null references public.pedido(id) on delete cascade,
produto_id uuid not null references public.estoque(id) on delete restrict,
qtd integer not null check (qtd > 0),
preco numeric(12,2) not null check (preco >= 0)
);

-- ===============================
-- [NOTA FISCAL]
-- ===============================
create table if not exists public.nota_fiscal (
id uuid primary key default gen_random_uuid(),
numero text not null unique,
cliente_id uuid references public.cliente(id) on delete set null,
total numeric(12,2) not null default 0,
status text not null check (status in ('emitida','paga','cancelada')) default 'emitida',
data timestamptz not null default now(),
criado_em timestamptz not null default now(),
atualizado_em timestamptz not null default now()
);

-- ===============================
-- [COMPROVANTE FIADO]
-- ===============================
create table if not exists public.comprovante_fiado (
id uuid primary key default gen_random_uuid(),
cliente_nome text not null,
telefone text,
email text,
endereco_cliente text,
total numeric(12,2) not null default 0,
vencimento date,
metodo text not null default 'Fiado',
data timestamptz not null default now(),
pago boolean not null default false,
criado_em timestamptz not null default now(),
atualizado_em timestamptz not null default now()
);

-- ===============================
-- [ITEM FIADO]
-- ===============================
create table if not exists public.item_fiado (
id uuid primary key default gen_random_uuid(),
comprovante_id uuid not null references public.comprovante_fiado(id) on delete cascade,
descricao text not null,
qtd integer not null check (qtd > 0),
preco numeric(12,2) not null check (preco >= 0)
);

-- ===============================
-- ÍNDICES
-- ===============================
create index if not exists idx_estoque_categoria on public.estoque(categoria);
create index if not exists idx_estoque_codigo on public.estoque(codigo_barras);
create index if not exists idx_cliente_nome on public.cliente(nome);
create index if not exists idx_financeiro_data on public.lancamento_financeiro(data);
create index if not exists idx_pedido_cliente on public.pedido(cliente_id);
create index if not exists idx_pedido_data on public.pedido(data);
create index if not exists idx_nf_numero on public.nota_fiscal(numero);
create index if not exists idx_fiado_pago on public.comprovante_fiado(pago);

-- ===============================
-- Funções com search_path fixo (evita "Function Search Path Mutable")
-- ===============================
create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
set search_path = public
as $$
begin
new.atualizado_em = now();
return new;
end;
$$;

create or replace function public.on_pedido_pago()
returns trigger
language plpgsql
set search_path = public
as $$
declare
it record;
begin
if new.status = 'pago' and (tg_op = 'INSERT' or coalesce(old.status,'') <> 'pago') then
  insert into public.lancamento_financeiro (tipo, descricao, categoria, valor, metodo, data)
  values ('entrada', 'Pedido ' || new.id, 'Vendas', new.total, new.metodo, new.data);

  for it in select produto_id, qtd from public.item_pedido where pedido_id = new.id loop
    update public.estoque set estoque = greatest(0, estoque - it.qtd) where id = it.produto_id;
  end loop;
end if;
return new;
end;
$$;

create or replace function public.on_fiado_pago()
returns trigger
language plpgsql
set search_path = public
as $$
begin
if new.pago = true and coalesce(old.pago,false) = false then
  insert into public.lancamento_financeiro (tipo, descricao, categoria, valor, metodo, data)
  values ('entrada', 'Fiado ' || new.id || ' pago', 'Vendas', new.total, 'Fiado', now());
end if;
return new;
end;
$$;

-- Triggers atualizado_em
do $$
begin
if not exists (select 1 from pg_trigger where tgname = 'trg_estoque_atualizado') then
  create trigger trg_estoque_atualizado before update on public.estoque
    for each row execute function public.set_atualizado_em();
end if;
if not exists (select 1 from pg_trigger where tgname = 'trg_cliente_atualizado') then
  create trigger trg_cliente_atualizado before update on public.cliente
    for each row execute function public.set_atualizado_em();
end if;
if not exists (select 1 from pg_trigger where tgname = 'trg_fornecedor_atualizado') then
  create trigger trg_fornecedor_atualizado before update on public.fornecedor
    for each row execute function public.set_atualizado_em();
end if;
if not exists (select 1 from pg_trigger where tgname = 'trg_pedido_atualizado') then
  create trigger trg_pedido_atualizado before update on public.pedido
    for each row execute function public.set_atualizado_em();
end if;
if not exists (select 1 from pg_trigger where tgname = 'trg_nf_atualizado') then
  create trigger trg_nf_atualizado before update on public.nota_fiscal
    for each row execute function public.set_atualizado_em();
end if;
if not exists (select 1 from pg_trigger where tgname = 'trg_fiado_atualizado') then
  create trigger trg_fiado_atualizado before update on public.comprovante_fiado
    for each row execute function public.set_atualizado_em();
end if;
end $$;

-- Triggers de negócio
do $$
begin
if not exists (select 1 from pg_trigger where tgname = 'trg_pedido_pago_ins') then
  create trigger trg_pedido_pago_ins after insert on public.pedido
    for each row execute function public.on_pedido_pago();
end if;
if not exists (select 1 from pg_trigger where tgname = 'trg_pedido_pago_upd') then
  create trigger trg_pedido_pago_upd after update of status on public.pedido
    for each row execute function public.on_pedido_pago();
end if;
if not exists (select 1 from pg_trigger where tgname = 'trg_fiado_pago_upd') then
  create trigger trg_fiado_pago_upd after update of pago on public.comprovante_fiado
    for each row execute function public.on_fiado_pago();
end if;
end $$;

-- ===============================
-- RLS (DEV): habilita e libera para anon/authenticated
-- ===============================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;

alter table public.estoque               enable row level security;
alter table public.cliente               enable row level security;
alter table public.fornecedor            enable row level security;
alter table public.lancamento_financeiro enable row level security;
alter table public.pedido                enable row level security;
alter table public.item_pedido           enable row level security;
alter table public.nota_fiscal           enable row level security;
alter table public.comprovante_fiado     enable row level security;
alter table public.item_fiado            enable row level security;

do $$
declare r record;
begin
for r in
  select policyname, tablename
  from pg_policies
  where schemaname = 'public'
    and tablename in ('estoque','cliente','fornecedor','lancamento_financeiro','pedido','item_pedido','nota_fiscal','comprovante_fiado','item_fiado')
loop
  execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
end loop;
end $$;

create policy "dev_all_estoque"            on public.estoque               for all to anon, authenticated using (true) with check (true);
create policy "dev_all_cliente"            on public.cliente               for all to anon, authenticated using (true) with check (true);
create policy "dev_all_fornecedor"         on public.fornecedor            for all to anon, authenticated using (true) with check (true);
create policy "dev_all_lancamento_fin"     on public.lancamento_financeiro for all to anon, authenticated using (true) with check (true);
create policy "dev_all_pedido"             on public.pedido                for all to anon, authenticated using (true) with check (true);
create policy "dev_all_item_pedido"        on public.item_pedido           for all to anon, authenticated using (true) with check (true);
create policy "dev_all_nota_fiscal"        on public.nota_fiscal           for all to anon, authenticated using (true) with check (true);
create policy "dev_all_comprovante_fiado"  on public.comprovante_fiado     for all to anon, authenticated using (true) with check (true);
create policy "dev_all_item_fiado"         on public.item_fiado            for all to anon, authenticated using (true) with check (true);

-- ===============================
-- SEEDS (DEMO)
-- ===============================
delete from public.item_pedido;
delete from public.pedido;
delete from public.nota_fiscal;
delete from public.lancamento_financeiro;
delete from public.item_fiado;
delete from public.comprovante_fiado;
delete from public.estoque;
delete from public.cliente;
delete from public.fornecedor;

insert into public.estoque (nome, categoria, preco, estoque, alerta_estoque, codigo_barras) values
('Antártica lata 350 ml', 'Cervejas', 4.90, 0, 2, null),
('Skol lata 350 ml',      'Cervejas', 4.70, 0, 2, null),
('Coca-Cola 2L',          'Refrigerantes', 12.90, 1, 3, '7894900010015'),
('Guaraná 2L',            'Refrigerantes', 10.90, 1, 3, null),
('Heineken 600 ml',       'Cervejas', 12.50, 2, 3, null),
('Gelo 2kg',              'Outros', 8.00, 1, 2, null),
('Água 500 ml',           'Água', 2.50, 1, 2, null),
('Energético 473 ml',     'Energéticos', 9.90, 2, 3, null);

insert into public.cliente (nome, email, telefone, total_gasto) values
('João Silva',  'joao@email.com',  '(11) 99999-0001', 124.40),
('Maria Souza', 'maria@email.com', '(11) 98888-0002', 232.10);

insert into public.lancamento_financeiro (tipo, descricao, categoria, valor, metodo, data) values
('entrada', 'Venda de Coca-Cola 2L', 'Vendas', 45.90, 'Dinheiro', now()),
('saida',   'Compra de estoque',     'Compras', 250.00, 'PIX',     now() - interval '1 day'),
('entrada', 'Venda fiado - João Silva','Vendas',78.50, 'Fiado',   now() - interval '2 day');

with c as (select id as cliente_id from public.cliente order by criado_em limit 1)
insert into public.pedido (cliente_id, metodo, status, total, data)
select c.cliente_id, 'Dinheiro', 'pago', 25.80, now() from c;

with o as (select id as pedido_id from public.pedido order by data desc limit 1),
   p as (select id as produto_id, preco from public.estoque where nome = 'Coca-Cola 2L' limit 1)
insert into public.item_pedido (pedido_id, produto_id, qtd, preco)
select o.pedido_id, p.produto_id, 2, p.preco from o, p;

with c as (select id as cliente_id from public.cliente order by criado_em desc limit 1)
insert into public.pedido (cliente_id, metodo, status, total, data)
select c.cliente_id, 'PIX', 'pendente', 25.00, now() - interval '1 hour' from c;

with o as (select id as pedido_id from public.pedido order by data desc limit 1),
   p as (select id as produto_id, preco from public.estoque where nome = 'Heineken 600 ml' limit 1)
insert into public.item_pedido (pedido_id, produto_id, qtd, preco)
select o.pedido_id, p.produto_id, 2, p.preco from o, p;

with c as (select id from public.cliente order by criado_em limit 1)
insert into public.nota_fiscal (numero, cliente_id, total, status, data)
select 'NF-0001', id, 89.40, 'emitida', now() from c;

insert into public.comprovante_fiado (cliente_nome, telefone, total, metodo, data, pago)
values ('João Silva', '(11) 99999-0001', 34.90, 'Fiado', now() - interval '2 day', false);

with r as (select id from public.comprovante_fiado order by data desc limit 1)
insert into public.item_fiado (comprovante_id, descricao, qtd, preco)
select r.id, 'Cerveja 600 ml', 2, 12.50 from r;

with r as (select id from public.comprovante_fiado order by data desc limit 1)
insert into public.item_fiado (comprovante_id, descricao, qtd, preco)
select r.id, 'Energético 473 ml', 1, 9.90 from r;

-- Verificações rápidas (opcional)
-- select (select count(*) from public.estoque) as c_estoque,
--        (select count(*) from public.cliente) as c_cliente;

-- FIM
