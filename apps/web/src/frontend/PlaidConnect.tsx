import React, { useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import type { PlaidLinkOptions } from 'react-plaid-link';
import { supabase } from './config/supabase';
import NavBar from './NavBar';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export default function PlaidConnect() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  // update effect + onSuccess to require a logged-in user (no anon fallback)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const user = data?.session?.user;
        if (!user) {
          setStatus('Please log in before connecting a bank.');
          setLoading(false);
          return;
        }
        const userId = user.id;

        const resp = await fetch(`${apiUrl}/api/plaid/link-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(JSON.stringify(json));
        setLinkToken(json.data.link_token ?? json.data?.link_token ?? null);
      } catch (err: unknown) {
        console.error('get link token failed', err);
        setStatus('Could not create link token. See console.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // onSuccess:
  const onSuccess = async (public_token: string) => {
    setStatus('Exchanging public token...');
    try {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;
      if (!user) throw new Error('User not logged in');
      const userId = user.id;

      const resp = await fetch(`${apiUrl}/api/plaid/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token, user_id: userId }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(JSON.stringify(json));
      setStatus('Bank connected. You can now sync accounts.');
    } catch (err: unknown) {
      console.error('exchange failed', err);
      setStatus('Exchange failed. Check server logs.');
    }
  };

  const config: PlaidLinkOptions = {
    token: linkToken,
    onSuccess,
    onExit: (err, metadata) => {
      if (err) {
        console.error('Plaid onExit error', err, metadata);
        setStatus('Plaid link closed with error.');
      } else {
        setStatus('Plaid link closed.');
      }
    },
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <>
      <NavBar />
      <div style={{ maxWidth: 720, margin: '1rem auto', padding: 16 }}>
        <h2>Connect your bank (Plaid)</h2>
        {loading && <div>Preparing Plaid Link...</div>}
        {status && <div style={{ margin: '8px 0', color: '#333' }}>{status}</div>}
        <button
          onClick={() => open()}
          disabled={!ready || !linkToken || loading}
          style={{ padding: '8px 12px', borderRadius: 6 }}
        >
          {ready && linkToken ? 'Connect bank' : 'Loading...'}
        </button>
        <p style={{ marginTop: 12, color: '#666' }}>
          Use Plaid sandbox credentials after clicking Connect (e.g. sandbox username/password shown in Plaid docs).
        </p>
      </div>
    </>
  );
}