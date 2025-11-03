-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin');

-- Create admin_users table
CREATE TABLE public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = _user_id
      AND is_active = true
  )
$$;

-- Only admins can view admin list
CREATE POLICY "Admins can view admin list" ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Add database constraints for input validation
ALTER TABLE public.doacoes
  ADD CONSTRAINT nome_doador_length CHECK (char_length(nome_doador) <= 100),
  ADD CONSTRAINT valor_positive CHECK (valor > 0),
  ADD CONSTRAINT valor_max CHECK (valor <= 100000);

-- Update RLS policies for doacoes table
DROP POLICY IF EXISTS "Permitir visualização pública de doações" ON public.doacoes;

-- Allow authenticated admins to view all donations
CREATE POLICY "Admins can view all donations" ON public.doacoes
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Keep public INSERT (donors can submit without login)
-- Existing policy "Permitir inserção pública de doações" remains unchanged

-- Make comprovantes bucket private
UPDATE storage.buckets 
SET public = false 
WHERE name = 'comprovantes';

-- Update storage RLS policies
DROP POLICY IF EXISTS "Permitir visualização pública dos comprovantes" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload público de comprovantes" ON storage.objects;

-- Allow public upload of receipts (donors need this without auth)
CREATE POLICY "Allow public upload to comprovantes" ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'comprovantes' AND
    (storage.foldername(name))[1] = 'comprovantes'
  );

-- Only admins can view receipts
CREATE POLICY "Admins can view comprovantes" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'comprovantes' AND
    public.is_admin(auth.uid())
  );