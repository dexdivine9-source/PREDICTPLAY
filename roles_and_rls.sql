-- =========================================================================
-- PredictPlay: Role System & Row Level Security (RLS) Migration
-- =========================================================================

-- 1. Add role column to player_profiles with default 'player'
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player';

-- Migrate any existing is_admin = true rows to role = 'admin'
-- ⚠️  WARNING: The application code (app/admin-actions.ts, lib/auth-server.ts)
--     STILL reads and writes the `is_admin` column. Dropping it here will break
--     "Manage Admins" and the admin check on the next deploy. The DROP is
--     therefore DISABLED. Remove the `is_admin` references from the app first,
--     then re-enable the drop in a dedicated migration if you want it gone.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_profiles' AND column_name = 'is_admin'
  ) THEN
    UPDATE player_profiles SET role = 'admin' WHERE is_admin = true;
    -- Drop old is_admin column if it was created
    -- DISABLED (see warning above): ALTER TABLE player_profiles DROP COLUMN IF EXISTS is_admin;
  END IF;
END $$;

-- Ensure all rows default to 'player' if NULL
UPDATE player_profiles SET role = 'player' WHERE role IS NULL;

-- Idempotency flags for the points bonus system (added with the bonus feature).
-- signup_bonus_granted:       set true after the 1000-pt wallet creation bonus is logged.
-- verification_bonus_granted: set true after the 1500-pt verification bonus is credited.
-- Both default false so existing rows are safe (they will be credited on next trigger).
ALTER TABLE public.player_profiles
  ADD COLUMN IF NOT EXISTS signup_bonus_granted       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_bonus_granted BOOLEAN DEFAULT false;

-- 2. Helper function to check if the current user is an admin
-- SECURITY: `SET search_path = ''` pins schema resolution so that a malicious
-- object planted in another schema cannot hijack this SECURITY DEFINER
-- function (a classic search-path / schema-injection attack). Because the
-- path is empty, every identifier below is fully schema-qualified (public.*,
-- auth.*); pg_catalog is always implicitly available for built-ins.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.player_profiles
    WHERE public.player_profiles.id = auth.uid()
      AND public.player_profiles.role = 'admin'
  );
END;
$$;

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
-- 5. SECURITY HARDENING — role/privilege lock + search_path pinning
--    Added 2026-08-27.
--
--    WHAT THIS DOES
--    • Hardens SECURITY DEFINER functions with `SET search_path = ''` to block
--      schema-injection / function hijacking.
--    • Adds a BEFORE INSERT OR UPDATE trigger on player_profiles so that ONLY
--      an existing admin can set or change the `role` (or legacy `is_admin`)
--      column. A regular user can NEVER elevate their own role — not through
--      the app, not through the supabase-js client, not via a direct
--      PostgREST/REST API call.
--
--    WHY A TRIGGER INSTEAD OF `REVOKE UPDATE (role) ... FROM authenticated`
--    • Admin promote/demote (updateUserRoleAction) runs through the signed-in
--      admin's OWN session — i.e. the `authenticated` Postgres role, the exact
--      same role every normal user has. A column-level REVOKE cannot tell an
--      admin apart from a regular user, so it would block admins too and break
--      the "Manage Admins" feature. A trigger evaluates auth.uid()/is_admin()
--      per row, so admins keep working while self-promotion is rejected.
--
--    ✅ SAFE TO RUN INDEPENDENTLY: everything in section 5 is idempotent and
--       additive — no data is modified, no columns are dropped. You can paste
--       JUST this section into the Supabase SQL Editor and run it on prod.
-- =========================================================================

-- 5a. Re-assert the hardened is_admin() so section 5 is self-contained
--     (identical to the definition in section 2 above).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.player_profiles
    WHERE public.player_profiles.id = auth.uid()
      AND public.player_profiles.role = 'admin'
  );
END;
$$;

-- 5b. Guard function: only an existing admin may set/alter role or is_admin.
--     Uses to_jsonb(NEW/OLD) so it works whether or not the legacy `is_admin`
--     column exists (a missing key reads as NULL rather than erroring).
CREATE OR REPLACE FUNCTION public.enforce_role_change_admin_only()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_j jsonb := to_jsonb(NEW);
  old_j jsonb;
BEGIN
  -- Privileged / non-end-user contexts have no auth.uid(): the Supabase SQL
  -- Editor, the Dashboard Table Editor, the service_role key, and SQL
  -- migrations. Let them through so bootstrapping the first admin and
  -- server-side tooling keep working. (End users always carry a non-null
  -- auth.uid(); the `anon` role cannot write player_profiles at all — RLS.)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Existing admins may change roles freely — this is what powers the
  -- "Manage Admins" promote/demote screen.
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- ---- From here on the caller is an authenticated NON-admin. ----

  IF TG_OP = 'INSERT' THEN
    -- A normal user may only ever create a plain 'player' profile row.
    IF COALESCE(new_j ->> 'role', 'player') <> 'player'
       OR COALESCE(new_j ->> 'is_admin', 'false') = 'true' THEN
      RAISE EXCEPTION 'Only administrators may assign elevated roles.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: reject any change to role or is_admin by a non-admin.
  old_j := to_jsonb(OLD);
  IF (new_j ->> 'role') IS DISTINCT FROM (old_j ->> 'role')
     OR (new_j ->> 'is_admin') IS DISTINCT FROM (old_j ->> 'is_admin') THEN
    RAISE EXCEPTION 'Only administrators may change a user role.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

-- 5c. Attach the guard (BEFORE INSERT OR UPDATE, one row at a time).
DROP TRIGGER IF EXISTS enforce_role_change_admin_only ON public.player_profiles;
CREATE TRIGGER enforce_role_change_admin_only
  BEFORE INSERT OR UPDATE ON public.player_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_role_change_admin_only();

-- 5d. NOTE on column privileges (defense-in-depth):
--     We intentionally do NOT `REVOKE UPDATE (role) ... FROM authenticated`
--     because admins act through the `authenticated` role too (see rationale
--     at the top of section 5), so the REVOKE would break them. The trigger
--     above is the enforcement point; `anon` cannot write these rows at all.

-- =========================================================================
-- 6. ADMIN-CURATED MATCHES & YES/NO MARKETS & NOTIFICATIONS
-- =========================================================================

-- 6a. Add is_admin_match, scheduled_start_time, question, and match_code to matches
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS is_admin_match BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduled_start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS question TEXT,
  ADD COLUMN IF NOT EXISTS match_code TEXT;

CREATE INDEX IF NOT EXISTS idx_matches_match_code ON public.matches (match_code);

-- 6b. Add market_type, question, yes_pool, no_pool to markets
ALTER TABLE public.markets
  ADD COLUMN IF NOT EXISTS market_type TEXT DEFAULT 'P1_P2_DRAW',
  ADD COLUMN IF NOT EXISTS question TEXT,
  ADD COLUMN IF NOT EXISTS yes_pool INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS no_pool INTEGER DEFAULT 0;

-- 6c. Create notifications table for match announcements and alerts
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL, -- e.g. 'ADMIN_MATCH_LIVE', 'MATCH_UPDATE'
  title        TEXT,
  message      TEXT,
  reference_id TEXT,
  is_read      BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications or global announcements" ON public.notifications;
CREATE POLICY "Users can read own notifications or global announcements"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());

DROP POLICY IF EXISTS "Authenticated users or admin insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users or admin insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR public.is_admin());

DROP POLICY IF EXISTS "Users can mark own notifications read" ON public.notifications;
CREATE POLICY "Users can mark own notifications read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

-- =========================================================================
-- BOOTSTRAPPING INSTRUCTIONS:
-- To bootstrap your first admin account:
-- 1. Open Supabase Dashboard -> Table Editor -> `player_profiles` table.
-- 2. Locate your user row.
-- 3. Double-click the `role` column and set it to: `admin`.
-- NOTE: This still works with the section-5 trigger in place — Dashboard/SQL
--       Editor edits run with no auth.uid(), which the guard lets through.
-- =========================================================================

