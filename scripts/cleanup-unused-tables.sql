-- Script to safely remove tables that are no longer needed after consolidation

-- Remove backup table created during migration
DROP TABLE IF EXISTS public.backup_itens_pedido CASCADE;

-- Remove original itens_pedido table (data now in pedidos.itens)
DROP TABLE IF EXISTS public.itens_pedido CASCADE;

-- Remove lancamentos_financeiros table (data now in pedidos table)
DROP TABLE IF EXISTS public.lancamentos_financeiros CASCADE;

-- Remove any views that might reference the deleted tables
DROP VIEW IF EXISTS public.backup_itens_pedido CASCADE;

-- Verify remaining tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
