-- =========================================================================
-- PredictPlay: Role System & Row Level Security (RLS) Migration
-- =========================================================================

-- 1. Add role column to player_profiles with default 'player'
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player';

-- Migrate any existing is_admin = true rows to role = 'admin'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'player_profiles' AND column_name = 'is_admin'
  ) THEN
    UPDATE player_profiles SET role = 'admin' WHERE is_admin = true;
    -- Drop old is_admin column if it was created
    ALTER TABLE player_profiles DROP COLUMN IF EXISTS is_admin;
  END IF;
END $$;

-- Ensure all rows default to 'player' if NULL
UPDATE player_profiles SET role = 'player' WHERE role IS NULL;

-- 2. Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.player_profiles 
    WHERE public.player_profiles.id = auth.uid() 
      AND public.player_profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Dedicated player_verification table (if used for isolated verification data)
CREATE TABLE IF NOT EXISTS public.player_verification (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  game_username TEXT,
  game_profile_screenshot_url TEXT,
  tracker_id TEXT,
  team TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'PENDING',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on player_verification
ALTER TABLE public.player_verification ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own verification, or Admins can read all
DROP POLICY IF EXISTS "Allow user or admin read verification" ON public.player_verification;
CREATE POLICY "Allow user or admin read verification"
ON public.player_verification
FOR SELECT
USING (
  auth.uid() = user_id OR public.is_admin()
);

-- RLS Policy: Users can insert/update their own verification, or Admins can update all
DROP POLICY IF EXISTS "Allow user or admin write verification" ON public.player_verification;
CREATE POLICY "Allow user or admin write verification"
ON public.player_verification
FOR ALL
USING (
  auth.uid() = user_id OR public.is_admin()
)
WITH CHECK (
  auth.uid() = user_id OR public.is_admin()
);

-- 4. Enable RLS on player_profiles
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;

-- Read policy: Public profiles viewable
DROP POLICY IF EXISTS "Allow public read player profiles" ON public.player_profiles;
CREATE POLICY "Allow public read player profiles"
ON public.player_profiles
FOR SELECT
USING (true);

-- Insert policy: User creates own profile on signup
DROP POLICY IF EXISTS "Allow user insert own profile" ON public.player_profiles;
CREATE POLICY "Allow user insert own profile"
ON public.player_profiles
FOR INSERT
WITH CHECK (
  auth.uid() = id OR public.is_admin()
);

-- Update policy: User can update own profile, Admins can update any profile (e.g. promoting roles, verifying)
DROP POLICY IF EXISTS "Allow user or admin update player profiles" ON public.player_profiles;
CREATE POLICY "Allow user or admin update player profiles"
ON public.player_profiles
FOR UPDATE
USING (
  auth.uid() = id OR public.is_admin()
)
WITH CHECK (
  auth.uid() = id OR public.is_admin()
);

-- =========================================================================
-- BOOTSTRAPPING INSTRUCTIONS:
-- To bootstrap your first admin account:
-- 1. Open Supabase Dashboard -> Table Editor -> `player_profiles` table.
-- 2. Locate your user row.
-- 3. Double-click the `role` column and set it to: `admin`.
-- =========================================================================
