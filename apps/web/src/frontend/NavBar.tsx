import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from './config/supabase';

export default function NavBar() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setLoggedIn(Boolean(data?.session));
    })();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session));
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  if (!loggedIn) return null;

  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    padding: '8px 12px',
    borderRadius: 6,
    textDecoration: 'none',
    color: isActive ? '#fff' : '#0b5cff',
    background: isActive ? '#0b5cff' : 'transparent',
  });

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,0.9)', borderBottom: '1px solid #eaeaea', backdropFilter: 'saturate(180%) blur(8px)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '10px 16px', display: 'flex', gap: 8 }}>
        <NavLink to="/dashboard" style={linkStyle}>Dashboard</NavLink>
        <NavLink to="/chat" style={linkStyle}>Chat</NavLink>
        <NavLink to="/plaid" style={linkStyle}>Plaid</NavLink>
      </div>
    </nav>
  );
}