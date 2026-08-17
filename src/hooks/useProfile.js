import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Fetches the current user's profile row (including role) from Supabase.
 * Returns { profile, loading, error }.
 */
export default function useProfile(user) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!!user);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) setError(err.message);
        else setProfile(data);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user]);

  return { profile, loading, error };
}
