-- Fix numero_pedido column and add sequence
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS numero_pedido VARCHAR(20);

-- Update existing records with sequential numbers
WITH numbered_pedidos AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM pedidos
  WHERE numero_pedido IS NULL
)
UPDATE pedidos 
SET numero_pedido = 'VENDA' || LPAD(numbered_pedidos.row_num::text, 5, '0')
FROM numbered_pedidos
WHERE pedidos.id = numbered_pedidos.id;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_pedidos_numero_pedido ON pedidos(numero_pedido);
