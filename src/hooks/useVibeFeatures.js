import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useVibeFeatures() {
  const [unlockedIds, setUnlockedIds] = useState([]);
  const [isPioneer, setIsPioneer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchServerPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: rpcError } = await supabase.rpc('get_unlocked_vibe_features');
      if (rpcError) throw new Error(`[RPC Error] ${rpcError.message}`);
      if (data) {
        setUnlockedIds(data.unlocked_ids || []);
        setIsPioneer(data.is_pioneer || false);
      }
    } catch (err) {
      console.error("Échec de synchronisation VIBE:", err);
      setError(err.message || "Erreur de connexion serveur.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED'].includes(event)) {
        fetchServerPermissions();
      }
    });
    const sub = data && data.subscription ? data.subscription : null;
    return () => { if (sub && typeof sub.unsubscribe === 'function') sub.unsubscribe(); };
  }, [fetchServerPermissions]);

  return { unlockedIds, isPioneer, loading, error };
}
