import React, { useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import type { PlaidLinkOptions } from 'react-plaid-link';
import { supabase } from './config/supabase';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

type Account = {
  account_id: string;
  name?: string;
  type?: string;
  subtype?: string;
  mask?: string;
  currency?: string;
  current_balance?: number | null;
};

export default function PlaidConnect() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const fetchAccounts = async (userId: string) => {
    setLoadingAccounts(true);
    try {
      const resp = await fetch(
        `${apiUrl}/api/plaid/accounts?user_id=${encodeURIComponent(userId)}`
      );
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error ?? 'Failed to fetch accounts');
      setAccounts(json.data ?? []);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const user = data?.session?.user;
        if (!user) {
          setStatus({ type: 'error', message: 'Please log in before connecting a bank.' });
          setLoading(false);
          return;
        }
        const userId = user.id;

        // Fetch existing accounts first
        await fetchAccounts(userId);

        // Check if already connected
        const statusResp = await fetch(`${apiUrl}/api/plaid/status?user_id=${encodeURIComponent(userId)}`);
        const statusJson = await statusResp.json();
        
        if (statusResp.ok && statusJson.connected) {
          setStatus({ type: 'success', message: 'Bank already connected.' });
          setLoading(false);
          return;
        }

        // Create link token if not connected
        const resp = await fetch(`${apiUrl}/api/plaid/link-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(JSON.stringify(json));
        setLinkToken(json.data?.link_token ?? null);
      } catch (err: unknown) {
        console.error('get link token failed', err);
        setStatus({ type: 'error', message: 'Could not create link token. Please try again.' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSuccess = async (public_token: string) => {
    setStatus({ type: 'info', message: 'Connecting your bank...' });
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
      
      setStatus({ type: 'success', message: 'Bank connected successfully!' });
      
      // Refresh accounts list
      await fetchAccounts(userId);
    } catch (err: unknown) {
      console.error('exchange failed', err);
      setStatus({ type: 'error', message: 'Connection failed. Please try again.' });
    }
  };

  const config: PlaidLinkOptions = {
    token: linkToken,
    onSuccess,
    onExit: (err, metadata) => {
      if (err) {
        console.error('Plaid onExit error', err, metadata);
        setStatus({ type: 'error', message: 'Connection was cancelled or failed.' });
      }
    },
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <Box sx={{ maxWidth: 1000, margin: '0 auto', padding: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Bank Connection
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Securely connect your bank account to track balances and transactions
        </Typography>
      </Box>

      {/* Status Alert */}
      {status && (
        <Alert severity={status.type} sx={{ mb: 3 }}>
          {status.message}
        </Alert>
      )}

      {/* Connection Card */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, border: '1px solid #e0e0e0' }}>
        <Box sx={{ textAlign: 'center' }}>
          <AccountBalanceIcon sx={{ fontSize: 64, color: '#0b5cff', mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            {accounts.length > 0 ? 'Add Another Bank' : 'Connect Your Bank'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
            {accounts.length > 0 
              ? 'You can connect multiple bank accounts to get a complete financial overview.'
              : 'We use Plaid to securely connect to your bank. Your credentials are never stored on our servers.'}
          </Typography>

          {loading ? (
            <CircularProgress />
          ) : (
            <Button
              variant="contained"
              size="large"
              onClick={() => open()}
              disabled={!ready || !linkToken}
              sx={{
                bgcolor: '#0b5cff',
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#0a4fd6',
                },
              }}
            >
              {ready && linkToken ? 'Connect Bank Account' : 'Loading...'}
            </Button>
          )}

          <Typography variant="caption" display="block" sx={{ mt: 2, color: '#999' }}>
            🔒 Bank-level 256-bit encryption
          </Typography>
        </Box>
      </Paper>

      {/* Connected Accounts */}
      {loadingAccounts ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : accounts.length > 0 ? (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckCircleIcon sx={{ color: '#4caf50', mr: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              Connected Accounts ({accounts.length})
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gap: 2 }}>
            {accounts.map((account) => (
              <Card
                key={account.account_id}
                elevation={1}
                sx={{
                  border: '1px solid #e0e0e0',
                  '&:hover': {
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {account.name ?? 'Unnamed Account'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {account.type && <span style={{ textTransform: 'capitalize' }}>{account.type}</span>}
                        {account.subtype && <span> • {account.subtype}</span>}
                        {account.mask && <span> • ****{account.mask}</span>}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {account.account_id}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', ml: 3 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Current Balance
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="primary">
                        {account.currency ?? '$'}
                        {account.current_balance?.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) ?? '0.00'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      ) : null}

      {/* Info Section */}
      <Paper elevation={0} sx={{ p: 3, mt: 4, bgcolor: '#f5f5f5' }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          How it works
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          • Click "Connect Bank Account" to launch the secure Plaid interface
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          • Search for your bank and log in with your credentials
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          • Select the accounts you want to connect
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Your accounts will appear here once connected
        </Typography>
      </Paper>
    </Box>
  );
}