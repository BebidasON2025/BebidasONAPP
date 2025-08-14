-- Add friendly order number column to pedidos table
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS numero_pedido VARCHAR(20);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON pedidos(numero_pedido);

-- Update existing records with friendly numbers
UPDATE pedidos 
SET numero_pedido = 'VENDA' || LPAD(ROW_NUMBER() OVER (ORDER BY criado_em, id)::text, 5, '0')
WHERE numero_pedido IS NULL;
