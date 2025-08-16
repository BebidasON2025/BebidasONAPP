-- Create function to update stock when orders are placed from menu
CREATE OR REPLACE FUNCTION update_stock(product_id UUID, quantity_sold INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE produtos 
  SET estoque = GREATEST(0, estoque - quantity_sold)
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;
