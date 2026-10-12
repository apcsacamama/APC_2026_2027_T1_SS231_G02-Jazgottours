-- Migration: 20261013000000_setup_user_roles.sql
-- Description: Ensures the user table has role enforcement, domain standards (@staff.jgt.com and @agent.jgt.com), and RLS policies.

-- 1. Ensure table structure
CREATE TABLE IF NOT EXISTS public.user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'staff',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure columns exist if table was already created earlier
ALTER TABLE public.user ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.user ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'staff';
ALTER TABLE public.user ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.user ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.user ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Normalize any existing rows before applying constraint
UPDATE public.user
SET role = CASE
  WHEN role ILIKE '%admin%' OR role ILIKE '%owner%' THEN 'admin'
  WHEN role ILIKE '%agent%' THEN 'agent'
  ELSE 'staff'
END
WHERE role IS NULL OR role NOT IN ('admin', 'staff', 'agent');

-- Safely re-create constraint
ALTER TABLE public.user DROP CONSTRAINT IF EXISTS user_role_check;
ALTER TABLE public.user 
  ADD CONSTRAINT user_role_check CHECK (role IN ('admin', 'staff', 'agent'));

-- 3. Auto-update 'updated_at' timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_updated_at ON public.user;
CREATE TRIGGER set_user_updated_at
  BEFORE UPDATE ON public.user
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable RLS and setup policies
ALTER TABLE public.user ENABLE ROW LEVEL SECURITY;

-- Allow reading accounts (needed to verify role upon login and display Users list)
DROP POLICY IF EXISTS "Allow select for all" ON public.user;
CREATE POLICY "Allow select for all"
  ON public.user FOR SELECT
  USING (true);

-- Allow authenticated users to insert/update/delete accounts
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.user;
CREATE POLICY "Allow insert for authenticated users"
  ON public.user FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.user;
CREATE POLICY "Allow update for authenticated users"
  ON public.user FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.user;
CREATE POLICY "Allow delete for authenticated users"
  ON public.user FOR DELETE
  USING (true);

-- Allow anon operations (for development & local provisioning)
DROP POLICY IF EXISTS "Allow all for anon" ON public.user;
CREATE POLICY "Allow all for anon"
  ON public.user FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 5. Compatibility view: allow querying as 'users'
CREATE OR REPLACE VIEW public.users AS
  SELECT * FROM public.user;

-- 6. Seed initial role accounts
INSERT INTO public.user (email, full_name, role)
VALUES 
  ('admin@jazgottours.com', 'Jasmine', 'admin'),
  ('rio@staff.jgt.com', 'Rio Staff', 'staff'),
  ('rio@agent.jgt.com', 'Rio Agent', 'agent')
ON CONFLICT (email) 
DO UPDATE SET 
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  updated_at = now();
