-- Adding preco_compra column to produtos table
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS preco_compra NUMERIC DEFAULT 0;

-- Update existing products to have a default purchase price of 0
UPDATE produtos SET preco_compra = 0 WHERE preco_compra IS NULL;
