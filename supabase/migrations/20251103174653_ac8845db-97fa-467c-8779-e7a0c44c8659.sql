-- Criar tabela de doações
CREATE TABLE public.doacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_doador TEXT NOT NULL DEFAULT 'Anônimo',
  valor NUMERIC(10, 2) NOT NULL CHECK (valor > 0),
  data TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metodo TEXT NOT NULL DEFAULT 'pix',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.doacoes ENABLE ROW LEVEL SECURITY;

-- Política para permitir que todos possam ver as doações
CREATE POLICY "Permitir visualização pública de doações" 
ON public.doacoes 
FOR SELECT 
USING (true);

-- Política para permitir que todos possam inserir doações
CREATE POLICY "Permitir inserção pública de doações" 
ON public.doacoes 
FOR INSERT 
WITH CHECK (true);

-- Criar índice para melhor performance nas consultas
CREATE INDEX idx_doacoes_data ON public.doacoes(data DESC);

-- Inserir a doação inicial de R$ 1.515,00
INSERT INTO public.doacoes (nome_doador, valor, metodo, data)
VALUES ('Saldo Inicial', 1515.00, 'pix', now());

-- Habilitar realtime para atualizações em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.doacoes;