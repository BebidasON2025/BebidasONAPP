-- Create cash register table
CREATE TABLE IF NOT EXISTS caixa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status VARCHAR(20) NOT NULL DEFAULT 'fechado' CHECK (status IN ('aberto', 'fechado')),
  valor_inicial DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_atual DECIMAL(10,2) NOT NULL DEFAULT 0,
  vendas_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  pedidos_count INTEGER NOT NULL DEFAULT 0,
  data_abertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  data_fechamento TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_caixa_status ON caixa(status);
CREATE INDEX IF NOT EXISTS idx_caixa_data_abertura ON caixa(data_abertura);

-- Add RLS policies
ALTER TABLE caixa ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all operations on caixa" ON caixa
  FOR ALL USING (true);
