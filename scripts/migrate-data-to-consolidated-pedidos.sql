-- Migrate data from separate tables to consolidated pedidos table
-- Run this AFTER running consolidate-pedidos-table.sql

-- Step 1: Migrate itens_pedido data to pedidos.itens JSONB column
UPDATE pedidos 
SET itens = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'produto_id', ip.produto_id,
        'nome', p.nome,
        'qtd', ip.qtd,
        'preco', ip.preco,
        'subtotal', (ip.qtd * ip.preco)
      )
    ), 
    '[]'::jsonb
  )
  FROM itens_pedido ip
  LEFT JOIN produtos p ON p.id = ip.produto_id
  WHERE ip.pedido_id = pedidos.id
)
WHERE EXISTS (
  SELECT 1 FROM itens_pedido WHERE pedido_id = pedidos.id
);

-- Step 2: Update valor_pago from total for existing orders
UPDATE pedidos 
SET valor_pago = total 
WHERE valor_pago = 0 AND total > 0;

-- Step 3: Set origem based on existing data patterns
UPDATE pedidos 
SET origem = CASE 
  WHEN cliente_nome_texto IS NOT NULL AND cliente_nome_texto != '' THEN 'cardapio'
  WHEN cliente_id IS NOT NULL THEN 'sistema'
  ELSE 'sistema'
END
WHERE origem IS NULL;

-- Step 4: Migrate relevant financial data (optional - only if you want to link financial records)
-- This updates pedidos with matching financial transactions
UPDATE pedidos 
SET categoria_financeira = lf.categoria,
    observacoes = lf.descricao
FROM lancamentos_financeiros lf
WHERE lf.tipo = 'receita' 
  AND lf.valor = pedidos.total
  AND DATE(lf.data) = DATE(pedidos.data)
  AND pedidos.categoria_financeira IS NULL;

-- Step 5: Verify migration results
-- Count records to ensure data integrity
DO $$
DECLARE
  pedidos_count INTEGER;
  itens_migrated INTEGER;
  total_itens INTEGER;
BEGIN
  SELECT COUNT(*) INTO pedidos_count FROM pedidos;
  SELECT COUNT(*) INTO total_itens FROM itens_pedido;
  SELECT COUNT(*) INTO itens_migrated FROM pedidos WHERE jsonb_array_length(itens) > 0;
  
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE 'Total pedidos: %', pedidos_count;
  RAISE NOTICE 'Total itens_pedido records: %', total_itens;
  RAISE NOTICE 'Pedidos with migrated items: %', itens_migrated;
  
  IF itens_migrated = 0 AND total_itens > 0 THEN
    RAISE WARNING 'No items were migrated! Check the migration logic.';
  END IF;
END $$;

-- Step 6: Create backup views for rollback (optional)
CREATE OR REPLACE VIEW backup_itens_pedido AS 
SELECT 
  pedidos.id as pedido_id,
  (jsonb_array_elements(pedidos.itens)->>'produto_id')::uuid as produto_id,
  (jsonb_array_elements(pedidos.itens)->>'qtd')::integer as qtd,
  (jsonb_array_elements(pedidos.itens)->>'preco')::numeric as preco
FROM pedidos 
WHERE jsonb_array_length(itens) > 0;

COMMENT ON VIEW backup_itens_pedido IS 'Backup view to recreate itens_pedido table if needed';
