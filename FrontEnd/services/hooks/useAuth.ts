import { useState, useEffect } from 'react';
import { supabase } from '../../src/supabaseClient';

export const useAuth = () => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  useEffect(() => {
    setUser(session?.user ?? null);
  }, [session]);

  return { user, session };
};
