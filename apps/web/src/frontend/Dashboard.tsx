import React, { useEffect, useState } from 'react';
import { supabase } from './config/supabase';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

type Account = {
  account_id: string;
  name?: string;
  mask?: string;
  type?: string;
  subtype?: string;
  current_balance?: number | null;
  available_balance?: number | null;
  currency?: string | null;
  created_at?: string;
};

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Get logged-in user id from Supabase session
        const { data } = await supabase.auth.getSession();
        const userId = data?.session?.user?.id;
        if (!userId) {
          setAccounts([]);
          setLoading(false);
          return;
        }

        const resp = await fetch(`${apiUrl}/api/plaid/accounts?user_id=${encodeURIComponent(userId)}`);
        const json = await resp.json();
        if (!resp.ok) throw new Error(json?.error ?? 'Failed to fetch accounts');

        setAccounts(json.data ?? []);
      } catch (err) {
        console.error('Failed to load accounts:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '1rem auto', padding: '1rem' }}>
      <h2>Welcome to your Dashboard</h2>
      <p>Below are your linked accounts (from Plaid):</p>

      {loading && <div>Loading accounts...</div>}

      {!loading && accounts.length === 0 && (
        <div>No linked accounts found. Connect a bank on the Plaid page.</div>
      )}

      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {accounts.map((a) => (
          <div key={a.account_id} style={{ padding: 12, border: '1px solid #e0e0e0', borderRadius: 8, background: '#fff' }}>
            <div style={{ fontWeight: 600 }}>{a.name ?? 'Unnamed account'}</div>
            <div style={{ color: '#666', fontSize: 13 }}>
              {a.type ?? ''} {a.subtype ? `• ${a.subtype}` : ''} {a.mask ? `• ****${a.mask}` : ''}
            </div>
            <div style={{ marginTop: 8 }}>
              Balance: {a.current_balance ?? '—'} {a.currency ?? ''}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
              Account ID: {a.account_id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}