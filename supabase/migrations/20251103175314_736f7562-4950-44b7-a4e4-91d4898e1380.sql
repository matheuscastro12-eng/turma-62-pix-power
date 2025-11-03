-- Adicionar coluna para o comprovante na tabela doacoes
ALTER TABLE public.doacoes 
ADD COLUMN comprovante_url TEXT;

-- Atualizar constraint para exigir comprovante em novas doações
-- (mantém as doações antigas sem comprovante)
ALTER TABLE public.doacoes 
ADD CONSTRAINT comprovante_obrigatorio 
CHECK (comprovante_url IS NOT NULL OR data < now());

-- Criar bucket para comprovantes
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes', 'comprovantes', true);

-- Política para permitir upload de comprovantes por qualquer pessoa
CREATE POLICY "Permitir upload público de comprovantes"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'comprovantes');

-- Política para visualização pública dos comprovantes
CREATE POLICY "Permitir visualização pública de comprovantes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'comprovantes');