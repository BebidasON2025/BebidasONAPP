-- Add missing transacao_financeira column to pedidos table
-- This column stores financial transaction data as JSONB when orders are marked as paid

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS transacao_financeira JSONB;

-- Add index for better performance on financial queries
CREATE INDEX IF NOT EXISTS idx_pedidos_transacao_financeira ON pedidos USING GIN (transacao_financeira);

-- Add comment to document the column purpose
COMMENT ON COLUMN pedidos.transacao_financeira IS 'JSONB object containing financial transaction details: tipo, descricao, categoria, valor, metodo, data';

-- Update existing paid orders to have transaction data
UPDATE pedidos 
SET transacao_financeira = jsonb_build_object(
  'tipo', 'entrada',
  'descricao', CONCAT('Pedido ', COALESCE(numero_pedido, id::text), ' - Pagamento'),
  'categoria', 'Vendas',
  'valor', total,
  'metodo', metodo,
  'data', COALESCE(data_pagamento, data, criado_em)
)
WHERE status = 'pago' AND transacao_financeira IS NULL;
