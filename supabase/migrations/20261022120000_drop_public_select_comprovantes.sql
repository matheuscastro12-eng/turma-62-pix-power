-- Segurança (auditoria 2026-10-22, achado T1):
-- A policy de leitura pública dos comprovantes foi criada como
-- "Permitir visualização pública de comprovantes" (20251103175314), mas a
-- migration 20251103181010 tentou removê-la com o nome errado
-- ("...dos comprovantes"). Ela continuava valendo para anon e permitia listar
-- e baixar comprovantes PIX (dados pessoais) mesmo com o bucket privado.
DROP POLICY IF EXISTS "Permitir visualização pública de comprovantes" ON storage.objects;
DROP POLICY IF EXISTS "Permitir visualização pública dos comprovantes" ON storage.objects;

-- Garante que o bucket continua privado.
UPDATE storage.buckets
SET public = false
WHERE id = 'comprovantes';

-- A leitura continua restrita à policy "Admins can view comprovantes"
-- (TO authenticated USING bucket_id = 'comprovantes' AND public.is_admin(auth.uid())).
