-- Instalação completa PT‑BR (PLURAL) com a tabela public.produtos
-- Inclui índices, triggers, RLS habilitado + policies DEV e seeds.

begin;

create extension if not exists "pgcrypto";

-- ===============================
-- TABELAS (PT‑BR plural)
-- ===============================
create table if not exists public.produtos (
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

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text,
  telefone text,
  total_gasto numeric(12,2) not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text,
  telefone text,
  cnpj text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.lancamentos_financeiros (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('entrada','saida')),
  descricao text not null,
  categoria text not null,
  valor numeric(12,2) not null default 0,
  metodo text not null,
  data timestamptz not null default now(),
  criado_em timestamptz not null default now()
);

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete set null,
  metodo text not null,
  status text not null check (status in ('novo','pendente','pago','cancelado')) default 'novo',
  total numeric(12,2) not null default 0,
  data timestamptz not null default now(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.itens_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  produto_id uuid not null references public.produtos(id) on delete restrict,
  qtd integer not null check (qtd > 0),
  preco numeric(12,2) not null check (preco >= 0)
);

create table if not exists public.notas_fiscais (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  cliente_id uuid references public.clientes(id) on delete set null,
  total numeric(12,2) not null default 0,
  status text not null check (status in ('emitida','paga','cancelada')) default 'emitida',
  data timestamptz not null default now(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.comprovantes_fiado (
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

create table if not exists public.itens_fiado (
  id uuid primary key default gen_random_uuid(),
  comprovante_id uuid not null references public.comprovantes_fiado(id) on delete cascade,
  descricao text not null,
  qtd integer not null check (qtd > 0),
  preco numeric(12,2) not null check (preco >= 0)
);

-- ===============================
-- ÍNDICES
-- ===============================
create index if not exists idx_produtos_categoria on public.produtos(categoria);
create index if not exists idx_produtos_codigo    on public.produtos(codigo_barras);
create index if not exists idx_clientes_nome      on public.clientes(nome);
create index if not exists idx_fin_data           on public.lancamentos_financeiros(data);
create index if not exists idx_pedidos_cliente    on public.pedidos(cliente_id);
create index if not exists idx_pedidos_data       on public.pedidos(data);
create index if not exists idx_nf_numero          on public.notas_fiscais(numero);
create index if not exists idx_fiado_pago         on public.comprovantes_fiado(pago);

-- ===============================
-- FUNÇÕES (search_path fixo) + TRIGGERS
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

-- Atualiza "atualizado_em" nas tabelas que possuem a coluna
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_produtos_atualizado') then
    create trigger trg_produtos_atualizado before update on public.produtos
      for each row execute function public.set_atualizado_em();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_clientes_atualizado') then
    create trigger trg_clientes_atualizado before update on public.clientes
      for each row execute function public.set_atualizado_em();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_fornecedores_atualizado') then
    create trigger trg_fornecedores_atualizado before update on public.fornecedores
      for each row execute function public.set_atualizado_em();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_pedidos_atualizado') then
    create trigger trg_pedidos_atualizado before update on public.pedidos
      for each row execute function public.set_atualizado_em();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_nf_atualizado') then
    create trigger trg_nf_atualizado before update on public.notas_fiscais
      for each row execute function public.set_atualizado_em();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_comp_fiado_atualizado') then
    create trigger trg_comp_fiado_atualizado before update on public.comprovantes_fiado
      for each row execute function public.set_atualizado_em();
  end if;
end $$;

-- Baixa estoque + lança entrada quando pedido é pago
create or replace function public.on_pedido_pago()
returns trigger
language plpgsql
set search_path = public
as $$
declare it record;
begin
  if new.status = 'pago' and (tg_op = 'INSERT' or coalesce(old.status,'') <> 'pago') then
    insert into public.lancamentos_financeiros (tipo, descricao, categoria, valor, metodo, data)
    values ('entrada', 'Pedido ' || new.id, 'Vendas', new.total, new.metodo, new.data);

    for it in select produto_id, qtd from public.itens_pedido where pedido_id = new.id loop
      update public.produtos set estoque = greatest(0, estoque - it.qtd) where id = it.produto_id;
    end loop;
  end if;
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_pedidos_pago_ins') then
    create trigger trg_pedidos_pago_ins after insert on public.pedidos
      for each row execute function public.on_pedido_pago();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_pedidos_pago_upd') then
    create trigger trg_pedidos_pago_upd after update of status on public.pedidos
      for each row execute function public.on_pedido_pago();
  end if;
end $$;

-- Entrada quando fiado é marcado pago
create or replace function public.on_fiado_pago()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.pago = true and coalesce(old.pago,false) = false then
    insert into public.lancamentos_financeiros (tipo, descricao, categoria, valor, metodo, data)
    values ('entrada', 'Fiado ' || new.id || ' pago', 'Vendas', new.total, 'Fiado', now());
  end if;
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_comp_fiado_pago_upd') then
    create trigger trg_comp_fiado_pago_upd after update of pago on public.comprovantes_fiado
      for each row execute function public.on_fiado_pago();
  end if;
end $$;

-- ===============================
-- RLS (DEV): habilita + libera para anon/authenticated
-- ===============================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;

alter table public.produtos                 enable row level security;
alter table public.clientes                 enable row level security;
alter table public.fornecedores             enable row level security;
alter table public.lancamentos_financeiros  enable row level security;
alter table public.pedidos                  enable row level security;
alter table public.itens_pedido             enable row level security;
alter table public.notas_fiscais            enable row level security;
alter table public.comprovantes_fiado       enable row level security;
alter table public.itens_fiado              enable row level security;

-- Remove policies antigas (se houver) e cria DEV “for all”
do $$
declare r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'produtos','clientes','fornecedores','lancamentos_financeiros',
        'pedidos','itens_pedido','notas_fiscais','comprovantes_fiado','itens_fiado'
      )
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy "dev_all_produtos"               on public.produtos                for all to anon, authenticated using (true) with check (true);
create policy "dev_all_clientes"               on public.clientes                for all to anon, authenticated using (true) with check (true);
create policy "dev_all_fornecedores"           on public.fornecedores            for all to anon, authenticated using (true) with check (true);
create policy "dev_all_lancamentos_financeiros"on public.lancamentos_financeiros for all to anon, authenticated using (true) with check (true);
create policy "dev_all_pedidos"                on public.pedidos                 for all to anon, authenticated using (true) with check (true);
create policy "dev_all_itens_pedido"           on public.itens_pedido            for all to anon, authenticated using (true) with check (true);
create policy "dev_all_notas_fiscais"          on public.notas_fiscais           for all to anon, authenticated using (true) with check (true);
create policy "dev_all_comprovantes_fiado"     on public.comprovantes_fiado      for all to anon, authenticated using (true) with check (true);
create policy "dev_all_itens_fiado"            on public.itens_fiado             for all to anon, authenticated using (true) with check (true);

commit;

-- ===============================
-- SEEDS (DEMO)
-- ===============================
delete from public.itens_pedido;
delete from public.pedidos;
delete from public.notas_fiscais;
delete from public.lancamentos_financeiros;
delete from public.itens_fiado;
delete from public.comprovantes_fiado;
delete from public.produtos;
delete from public.clientes;
delete from public.fornecedores;

insert into public.produtos (nome, categoria, preco, estoque, alerta_estoque, codigo_barras) values
('Antártica lata 350 ml', 'Cervejas', 4.90, 0, 2, null),
('Skol lata 350 ml',      'Cervejas', 4.70, 0, 2, null),
('Coca-Cola 2L',          'Refrigerantes', 12.90, 1, 3, '7894900010015'),
('Guaraná 2L',            'Refrigerantes', 10.90, 1, 3, null),
('Heineken 600 ml',       'Cervejas', 12.50, 2, 3, null),
('Gelo 2kg',              'Outros', 8.00, 1, 2, null),
('Água 500 ml',           'Água', 2.50, 1, 2, null),
('Energético 473 ml',     'Energéticos', 9.90, 2, 3, null);

insert into public.clientes (nome, email, telefone, total_gasto) values
('João Silva',  'joao@email.com',  '(11) 99999-0001', 124.40),
('Maria Souza', 'maria@email.com', '(11) 98888-0002', 232.10);

insert into public.lancamentos_financeiros (tipo, descricao, categoria, valor, metodo, data) values
('entrada', 'Venda de Coca-Cola 2L', 'Vendas', 45.90, 'Dinheiro', now()),
('saida',   'Compra de estoque',     'Compras', 250.00, 'PIX',     now() - interval '1 day'),
('entrada', 'Venda fiado - João Silva','Vendas',78.50, 'Fiado',   now() - interval '2 day');

-- Pedido pago (baixa estoque via trigger)
with c as (select id as cliente_id from public.clientes order by criado_em limit 1)
insert into public.pedidos (cliente_id, metodo, status, total, data)
select c.cliente_id, 'Dinheiro', 'pago', 25.80, now() from c;

with o as (select id as pedido_id from public.pedidos order by data desc limit 1),
     p as (select id as produto_id, preco from public.produtos where nome = 'Coca-Cola 2L' limit 1)
insert into public.itens_pedido (pedido_id, produto_id, qtd, preco)
select o.pedido_id, p.produto_id, 2, p.preco from o, p;

-- Pedido pendente
with c as (select id as cliente_id from public.clientes order by criado_em desc limit 1)
insert into public.pedidos (cliente_id, metodo, status, total, data)
select c.cliente_id, 'PIX', 'pendente', 25.00, now() - interval '1 hour' from c;

with o as (select id as pedido_id from public.pedidos order by data desc limit 1),
     p as (select id as produto_id, preco from public.produtos where nome = 'Heineken 600 ml' limit 1)
insert into public.itens_pedido (pedido_id, produto_id, qtd, preco)
select o.pedido_id, p.produto_id, 2, p.preco from o, p;

-- Nota fiscal
with c as (select id from public.clientes order by criado_em limit 1)
insert into public.notas_fiscais (numero, cliente_id, total, status, data)
select 'NF-0001', id, 89.40, 'emitida', now() from c;

-- Fiado
insert into public.comprovantes_fiado (cliente_nome, telefone, total, metodo, data, pago)
values ('João Silva', '(11) 99999-0001', 34.90, 'Fiado', now() - interval '2 day', false);

with r as (select id from public.comprovantes_fiado order by data desc limit 1)
insert into public.itens_fiado (comprovante_id, descricao, qtd, preco)
select r.id, 'Cerveja 600 ml', 2, 12.50 from r;

with r as (select id from public.comprovantes_fiado order by data desc limit 1)
insert into public.itens_fiado (comprovante_id, descricao, qtd, preco)
select r.id, 'Energético 473 ml', 1, 9.90 from r;

-- FIM
