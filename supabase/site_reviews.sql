-- site_reviews.sql — Client reviews for builtsmartbyrob.com
-- Lives in the RMT CRM Supabase project (enowrzljapjkaxpsvdhr), applied 2026-10-22.
--
-- The website only ever holds the publishable key (anon role). anon can:
--   * read approved reviews (display columns only), and
--   * call the three site_* functions below.
-- Nothing else in this project is reachable with that key. Reviews are approved
-- by setting site_reviews.status = 'approved' in the Supabase table editor.
--
-- The admin password for admin/reviews.html is stored only as a SHA-256 hash in
-- site_settings (key 'admin_secret_sha256'); it is set outside this file.

CREATE TABLE public.site_invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash  text NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  note        text CHECK (char_length(note) <= 200),  -- private, never shown to the client
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz
);
ALTER TABLE public.site_invites ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_invites TO service_role;

CREATE TABLE public.site_reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id       uuid REFERENCES public.site_invites(id) ON DELETE SET NULL,
  firm_name       text NOT NULL CHECK (char_length(firm_name) BETWEEN 1 AND 150),
  display_name    text CHECK (char_length(display_name) <= 100),
  reviewer_title  text CHECK (char_length(reviewer_title) <= 100),
  rating          smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body            text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX site_reviews_invite_id_idx ON public.site_reviews (invite_id);
ALTER TABLE public.site_reviews ENABLE ROW LEVEL SECURITY;
GRANT SELECT (firm_name, display_name, reviewer_title, rating, body, status, created_at)
  ON public.site_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_reviews TO service_role;
CREATE POLICY "Approved reviews are public" ON public.site_reviews
  FOR SELECT TO anon USING (status = 'approved');

CREATE TABLE public.site_settings (
  key    text PRIMARY KEY,
  value  text NOT NULL
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO service_role;

-- Create a one-time invite. Returns its expiry, or NULL if the admin password is wrong.
CREATE FUNCTION public.site_create_invite(p_admin_secret text, p_token_hash text, p_note text)
RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_expires timestamptz := now() + interval '30 days';
BEGIN
  IF p_admin_secret IS NULL
     OR encode(sha256(convert_to(p_admin_secret, 'UTF8')), 'hex') IS DISTINCT FROM
        (SELECT value FROM public.site_settings WHERE key = 'admin_secret_sha256') THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.site_invites (token_hash, note, expires_at)
  VALUES (p_token_hash, nullif(left(btrim(p_note), 200), ''), v_expires);
  RETURN v_expires;
END;
$$;

-- True if the invite exists, is unused and unexpired.
CREATE FUNCTION public.site_validate_invite(p_token_hash text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.site_invites
    WHERE token_hash = p_token_hash AND used_at IS NULL AND expires_at > now()
  );
$$;

-- Use up the invite and store the review (pending approval) in one step.
-- Returns the review id, or NULL if the invite is invalid, used or expired.
CREATE FUNCTION public.site_redeem_invite(
  p_token_hash text, p_firm_name text, p_display_name text,
  p_reviewer_title text, p_rating int, p_body text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_invite uuid;
  v_review uuid;
BEGIN
  UPDATE public.site_invites SET used_at = now()
  WHERE token_hash = p_token_hash AND used_at IS NULL AND expires_at > now()
  RETURNING id INTO v_invite;

  IF v_invite IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.site_reviews (invite_id, firm_name, display_name, reviewer_title, rating, body)
  VALUES (v_invite, btrim(p_firm_name), nullif(btrim(p_display_name), ''),
          nullif(btrim(p_reviewer_title), ''), p_rating, btrim(p_body))
  RETURNING id INTO v_review;
  RETURN v_review;
END;
$$;

REVOKE ALL ON FUNCTION public.site_create_invite(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.site_validate_invite(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.site_redeem_invite(text, text, text, text, int, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.site_create_invite(text, text, text) TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.site_validate_invite(text) TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.site_redeem_invite(text, text, text, text, int, text) TO anon, service_role;
