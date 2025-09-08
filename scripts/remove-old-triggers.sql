-- Remove triggers that reference the deleted lancamentos_financeiros table

-- Drop the problematic triggers
DROP TRIGGER IF EXISTS trg_pedidos_pago_ins ON public.pedidos;
DROP TRIGGER IF EXISTS trg_pedidos_pago_upd ON public.pedidos;
DROP TRIGGER IF EXISTS trg_comp_fiado_pago_upd ON public.comprovantes_fiado;

-- Drop the functions that reference lancamentos_financeiros
DROP FUNCTION IF EXISTS public.on_pedido_pago();
DROP FUNCTION IF EXISTS public.on_fiado_pago();

-- Create new simplified trigger for stock management only
CREATE OR REPLACE FUNCTION public.on_pedido_pago_stock_only()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE 
  item_record RECORD;
BEGIN
  -- Only handle stock reduction when order is marked as paid
  IF NEW.status = 'pago' AND (TG_OP = 'INSERT' OR COALESCE(OLD.status,'') <> 'pago') THEN
    -- Reduce stock for each item in the order
    FOR item_record IN 
      SELECT 
        (jsonb_array_elements(NEW.itens)->>'produto_id')::uuid as produto_id,
        (jsonb_array_elements(NEW.itens)->>'qtd')::integer as qtd
      FROM (SELECT NEW.itens) as items_data
      WHERE jsonb_array_length(NEW.itens) > 0
    LOOP
      UPDATE public.produtos 
      SET estoque = GREATEST(0, estoque - item_record.qtd) 
      WHERE id = item_record.produto_id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create new triggers for stock management
CREATE TRIGGER trg_pedidos_pago_stock_ins 
  AFTER INSERT ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.on_pedido_pago_stock_only();

CREATE TRIGGER trg_pedidos_pago_stock_upd 
  AFTER UPDATE OF status ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.on_pedido_pago_stock_only();
