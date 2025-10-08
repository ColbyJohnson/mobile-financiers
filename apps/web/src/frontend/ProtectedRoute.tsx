import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from './config/supabase';

export default function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setAuthed(!!data?.session);
      } catch {
        setAuthed(false);
      } finally {
        setChecked(true);
      }
    })();
  }, []);

  if (!checked) return <div>Checking authentication...</div>;
  if (!authed) return <Navigate to="/" replace />;
  return children;
}