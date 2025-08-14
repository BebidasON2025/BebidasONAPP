-- Add missing columns to pedidos table
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS numero_pedido VARCHAR(20),
ADD COLUMN IF NOT EXISTS cliente_nome_texto VARCHAR(255);

-- Create index for numero_pedido for better performance
CREATE INDEX IF NOT EXISTS idx_pedidos_numero_pedido ON pedidos(numero_pedido);

-- Update existing records with sequential numbers
DO $$
DECLARE
    rec RECORD;
    counter INTEGER := 1;
BEGIN
    FOR rec IN SELECT id FROM pedidos WHERE numero_pedido IS NULL ORDER BY criado_em ASC, id ASC
    LOOP
        UPDATE pedidos 
        SET numero_pedido = 'VENDA' || LPAD(counter::text, 5, '0')
        WHERE id = rec.id;
        counter := counter + 1;
    END LOOP;
END $$;
