-- Create consolidated pedidos table structure
-- Add new columns to pedidos table to consolidate all order-related data

-- Add columns for order items (JSON format to store multiple items)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS itens JSONB DEFAULT '[]'::jsonb;

-- Add columns for financial information
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS tipo_transacao TEXT DEFAULT 'venda';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS categoria_financeira TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Add columns for payment details
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS valor_pago NUMERIC DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS troco NUMERIC DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS desconto NUMERIC DEFAULT 0;

-- Add columns for delivery/customer info
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco_entrega TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS telefone_cliente TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS taxa_entrega NUMERIC DEFAULT 0;

-- Add columns for order tracking
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS data_entrega TIMESTAMP WITH TIME ZONE;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS entregador TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'sistema'; -- sistema, cardapio, whatsapp

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(data);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_origem ON pedidos(origem);
CREATE INDEX IF NOT EXISTS idx_pedidos_criado_em ON pedidos(criado_em);

-- Add constraints
ALTER TABLE pedidos ADD CONSTRAINT chk_pedidos_total_positive CHECK (total >= 0);
ALTER TABLE pedidos ADD CONSTRAINT chk_pedidos_valor_pago_positive CHECK (valor_pago >= 0);
ALTER TABLE pedidos ADD CONSTRAINT chk_pedidos_troco_positive CHECK (troco >= 0);

COMMENT ON COLUMN pedidos.itens IS 'JSON array containing order items with produto_id, nome, qtd, preco, subtotal';
COMMENT ON COLUMN pedidos.origem IS 'Source of the order: sistema, cardapio, whatsapp';
COMMENT ON COLUMN pedidos.tipo_transacao IS 'Type of transaction: venda, devolucao, cancelamento';
