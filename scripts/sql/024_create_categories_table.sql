-- Create categories table
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  cor VARCHAR(7) DEFAULT '#3B82F6',
  icone VARCHAR(50) DEFAULT 'Package',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categorias (nome, cor, icone) VALUES
  ('Bebidas', '#10B981', 'Coffee'),
  ('Sucos', '#F59E0B', 'Apple'),
  ('Refrigerantes', '#EF4444', 'Zap'),
  ('Cervejas', '#F97316', 'Beer'),
  ('Energéticos', '#8B5CF6', 'Zap'),
  ('Águas', '#06B6D4', 'Droplets'),
  ('Gelos', '#6B7280', 'Snowflake')
ON CONFLICT (nome) DO NOTHING;

-- Update existing products to use category IDs if needed
-- This will help standardize categories across the system
UPDATE produtos SET categoria = 'Bebidas' WHERE categoria IN ('bebidas', 'Bebida', 'BEBIDAS');
UPDATE produtos SET categoria = 'Sucos' WHERE categoria IN ('sucos', 'Suco', 'SUCOS');
UPDATE produtos SET categoria = 'Refrigerantes' WHERE categoria IN ('refrigerantes', 'Refrigerante', 'REFRIGERANTES');
UPDATE produtos SET categoria = 'Cervejas' WHERE categoria IN ('cervejas', 'Cerveja', 'CERVEJAS');
UPDATE produtos SET categoria = 'Energéticos' WHERE categoria IN ('energeticos', 'Energético', 'ENERGÉTICOS');
UPDATE produtos SET categoria = 'Águas' WHERE categoria IN ('aguas', 'Água', 'ÁGUAS');
UPDATE produtos SET categoria = 'Gelos' WHERE categoria IN ('gelos', 'Gelo', 'GELOS');
