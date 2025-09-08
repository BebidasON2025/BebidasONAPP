-- Script para limpar tabelas e views não utilizadas após consolidação
-- Execute este script para remover objetos desnecessários

-- Remover views de backup (usar DROP VIEW)
DROP VIEW IF EXISTS public.backup_itens_pedido CASCADE;

-- Remover tabelas não utilizadas (usar DROP TABLE)
DROP TABLE IF EXISTS public.itens_pedido CASCADE;
DROP TABLE IF EXISTS public.lancamentos_financeiros CASCADE;

-- Verificar se existem outras views ou tabelas relacionadas
-- Remover qualquer constraint ou índice órfão
DO $$
BEGIN
    -- Remover índices órfãos se existirem
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_itens_pedido_pedido_id') THEN
        DROP INDEX IF EXISTS idx_itens_pedido_pedido_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lancamentos_pedido_id') THEN
        DROP INDEX IF EXISTS idx_lancamentos_pedido_id;
    END IF;
END $$;

-- Limpar qualquer função ou trigger relacionado às tabelas removidas
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_pedido_total() CASCADE;

-- Verificar objetos restantes
SELECT 
    schemaname,
    tablename as object_name,
    'table' as object_type
FROM pg_tables 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    schemaname,
    viewname as object_name,
    'view' as object_type
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY object_type, object_name;
