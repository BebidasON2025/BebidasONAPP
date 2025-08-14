-- Adding image column to produtos table to fix upload error
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS imagem TEXT;

-- Update any existing products to have null image initially
UPDATE produtos SET imagem = NULL WHERE imagem IS NULL;
