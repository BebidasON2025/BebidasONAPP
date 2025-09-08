-- Add missing data_pagamento column to pedidos table
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS data_pagamento timestamp with time zone;

-- Create index for better performance on payment date queries
CREATE INDEX IF NOT EXISTS idx_pedidos_data_pagamento ON public.pedidos(data_pagamento);

-- Drop any remaining triggers that reference lancamentos_financeiros
DROP TRIGGER IF EXISTS on_pedido_pago_trigger ON public.pedidos;
DROP TRIGGER IF EXISTS pedido_pago_trigger ON public.pedidos;
DROP TRIGGER IF EXISTS lancamento_financeiro_trigger ON public.pedidos;

-- Drop any remaining functions that reference lancamentos_financeiros
DROP FUNCTION IF EXISTS public.on_pedido_pago() CASCADE;
DROP FUNCTION IF EXISTS public.create_lancamento_financeiro() CASCADE;
DROP FUNCTION IF EXISTS public.handle_pedido_pago() CASCADE;

-- Create a simple trigger to update data_pagamento when status changes to 'pago'
CREATE OR REPLACE FUNCTION public.update_data_pagamento()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update data_pagamento when status changes to 'pago'
  IF NEW.status = 'pago' AND (OLD.status IS NULL OR OLD.status != 'pago') THEN
    NEW.data_pagamento = NOW();
  END IF;
  
  -- Clear data_pagamento if status changes from 'pago' to something else
  IF NEW.status != 'pago' AND OLD.status = 'pago' THEN
    NEW.data_pagamento = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating payment date
DROP TRIGGER IF EXISTS update_data_pagamento_trigger ON public.pedidos;
CREATE TRIGGER update_data_pagamento_trigger
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_data_pagamento();

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pedidos' AND column_name = 'data_pagamento';
