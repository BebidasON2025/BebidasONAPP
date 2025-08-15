-- Creating separate table for purchase prices to ensure data persistence
CREATE TABLE IF NOT EXISTS precos_compra (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  preco_compra NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(produto_id)
);

-- Adding index for better performance
CREATE INDEX IF NOT EXISTS idx_precos_compra_produto_id ON precos_compra(produto_id);

-- Adding trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_precos_compra_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_precos_compra_updated_at
  BEFORE UPDATE ON precos_compra
  FOR EACH ROW
  EXECUTE FUNCTION update_precos_compra_updated_at();
