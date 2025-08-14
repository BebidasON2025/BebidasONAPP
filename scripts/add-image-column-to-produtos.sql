-- Add image column to produtos table
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS imagem TEXT;

-- Add comment to the column
COMMENT ON COLUMN produtos.imagem IS 'Base64 encoded image data for product photos';
