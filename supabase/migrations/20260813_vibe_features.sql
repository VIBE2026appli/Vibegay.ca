-- 1. EXTENSION DE LA TABLE UTILISATEURS
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS is_pioneer BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS pioneer_expires_at TIMESTAMPTZ DEFAULT NULL;

-- 2. TABLE SOURCE DE VÉRITÉ DES FONCTIONNALITÉS
CREATE TABLE IF NOT EXISTS public.vibe_features (
  id INT PRIMARY KEY,
  season TEXT NOT NULL,
  title TEXT NOT NULL,
  public_access TIMESTAMPTZ NOT NULL,
  pioneer_access TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.vibe_features ENABLE ROW LEVEL SECURITY;

-- 3. INSERTION/UPDATE DES 16 FONCTIONNALITÉS
INSERT INTO public.vibe_features (id, season, title, public_access, pioneer_access) VALUES
  (1,  'Saison 1', 'Mode Fantôme (Silhouette & Brouillard)',         '2026-09-01T19:00:00-04:00', '2026-08-30T19:00:00-04:00'),
  (2,  'Saison 1', 'Panic Shake & Camouflage Express',               '2026-10-01T19:00:00-04:00', '2026-09-29T19:00:00-04:00'),
  (3,  'Saison 1', 'Proof of Life (Garantie 100% Humain)',           '2026-11-01T19:00:00-05:00', '2026-10-30T20:00:00-04:00'),
  (4,  'Saison 1', 'La Bulle de Silence (Filtre d''Intention)',      '2026-12-01T19:00:00-05:00', '2026-11-29T19:00:00-05:00'),
  (5,  'Saison 2', 'Le Bouton Rouge (Roulette Audio Flash)',         '2027-01-01T19:00:00-05:00', '2026-12-30T19:00:00-05:00'),
  (6,  'Saison 2', 'Whisper Protocol (Audio Binaural 3D)',           '2027-02-01T19:00:00-05:00', '2027-01-30T19:00:00-05:00'),
  (7,  'Saison 2', 'Blind Vibe Test (15s Audio)',                    '2027-03-01T19:00:00-05:00', '2027-02-27T19:00:00-05:00'),
  (8,  'Saison 2', 'Beat Match (Synchro Musicale)',                  '2027-04-01T19:00:00-04:00', '2027-03-30T19:00:00-04:00'),
  (9,  'Saison 3', 'Radar Pulse (In-Venue Bluetooth BLE)',           '2027-05-01T19:00:00-04:00', '2027-04-29T19:00:00-04:00'),
  (10, 'Saison 3', 'Mémoire Sonore (Échos GPS)',                     '2027-06-01T19:00:00-04:00', '2027-05-30T19:00:00-04:00'),
  (11, 'Saison 3', 'Brouillard Bio-Spatial 3D',                      '2027-07-01T19:00:00-04:00', '2027-06-29T19:00:00-04:00'),
  (12, 'Saison 3', 'Synchro-Heartbeat (Impulsion Mutuelle)',         '2027-08-01T19:00:00-04:00', '2027-07-30T19:00:00-04:00'),
  (13, 'Saison 4', 'Tribunal Éphémère (Modération Communautaire)',   '2027-09-01T19:00:00-04:00', '2027-08-30T19:00:00-04:00'),
  (14, 'Saison 4', 'Karma Vibe (Système de Réputation Dynamique)',   '2027-10-01T19:00:00-04:00', '2027-09-29T19:00:00-04:00'),
  (15, 'Saison 4', 'Wingman AI (Copilote de Rencontre)',             '2027-11-01T19:00:00-04:00', '2027-10-30T19:00:00-04:00'),
  (16, 'Saison 4', 'Passeport VIBE (Accès Multi-Villes)',            '2027-12-01T19:00:00-05:00', '2027-11-29T19:00:00-05:00')
ON CONFLICT (id) DO UPDATE SET
  season = EXCLUDED.season,
  title = EXCLUDED.title,
  public_access = EXCLUDED.public_access,
  pioneer_access = EXCLUDED.pioneer_access;

-- 4. VUE PUBLIQUE
CREATE OR REPLACE VIEW public.vibe_features_public AS
  SELECT id, season, title FROM public.vibe_features;

REVOKE SELECT ON public.vibe_features FROM anon, authenticated;
GRANT SELECT ON public.vibe_features_public TO anon, authenticated;

-- 5. RPC SÉCURISÉE
CREATE OR REPLACE FUNCTION get_unlocked_vibe_features()
RETURNS JSON AS $$
DECLARE
  is_pioneer_active BOOLEAN := FALSE;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT COALESCE(
      (COALESCE(is_pioneer, FALSE) OR role = 'pioneer')
      AND pioneer_expires_at IS NOT NULL
      AND pioneer_expires_at > NOW(),
      FALSE
    ) INTO is_pioneer_active
    FROM public.users WHERE id = auth.uid();
  END IF;

  RETURN json_build_object(
    'is_pioneer', is_pioneer_active,
    'unlocked_ids', COALESCE((
      SELECT array_agg(id ORDER BY id) FROM public.vibe_features
      WHERE NOW() >= public_access
         OR (is_pioneer_active AND NOW() >= pioneer_access)
    ), ARRAY[]::INT[])
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION get_unlocked_vibe_features() FROM public;
GRANT EXECUTE ON FUNCTION get_unlocked_vibe_features() TO authenticated, anon;
