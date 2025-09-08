-- Remove all triggers and functions that reference lancamentos_financeiros table
-- This will fix the "relation public.lancamentos_financeiros does not exist" error

-- Drop triggers first
DROP TRIGGER IF EXISTS on_pedido_pago ON public.pedidos;
DROP TRIGGER IF EXISTS on_pedido_status_change ON public.pedidos;
DROP TRIGGER IF EXISTS trigger_lancamento_financeiro ON public.pedidos;

-- Drop functions that reference the old table
DROP FUNCTION IF EXISTS public.on_pedido_pago();
DROP FUNCTION IF EXISTS public.handle_pedido_status_change();
DROP FUNCTION IF EXISTS public.create_lancamento_financeiro();

-- Create a simple trigger to only handle stock reduction when order is paid
CREATE OR REPLACE FUNCTION public.handle_pedido_pago()
RETURNS TRIGGER AS $$
BEGIN
  -- Only reduce stock when status changes to 'pago'
  IF NEW.status = 'pago' AND OLD.status != 'pago' THEN
    -- Update stock for each item in the order
    UPDATE public.produtos 
    SET estoque = estoque - (item->>'qtd')::integer
    FROM jsonb_array_elements(NEW.itens) AS item
    WHERE produtos.id = (item->>'produto_id')::uuid;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the new trigger
CREATE TRIGGER on_pedido_pago_stock_update
  AFTER UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_pedido_pago();

-- Verify no references to lancamentos_financeiros remain
SELECT 
  schemaname, 
  tablename, 
  definition 
FROM pg_views 
WHERE definition ILIKE '%lancamentos_financeiros%'
UNION ALL
SELECT 
  n.nspname as schemaname,
  p.proname as tablename,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%lancamentos_financeiros%';
