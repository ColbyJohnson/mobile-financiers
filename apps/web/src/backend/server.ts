import express from 'express';
import cors from 'cors';
import { supabase } from './config/supabase';
import { userService } from './services/userService'; // Make sure this path is correct
import {
  createSandboxPublicToken,
  createLinkToken,
  exchangePublicTokenAndStore,
  syncToSupabase,
} from './services/plaidService';
import { plaidClient } from './config/plaid';
import type { CountryCode } from 'plaid'; // Import CountryCode type
import { gemini, GEMINI_MODEL, safety } from './config/gemini';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' });
});

// Test endpoint
app.get('/api/test', (_, res) => {
  res.json({ message: 'Server is running!' });
});

// Supabase connection test
app.get('/api/db-test', async (_, res) => {
  try {
    // Try to query the database
    const { data, error } = await supabase
      .from('_ms_usage')  // This table always exists in Supabase
      .select('*')
      .limit(1);
    
    if (error) {
      throw error;
    }

    res.json({
      status: 'Connected to Supabase',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      data
    });

  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create user'
    });
  }
});

// List users
app.get('/api/users', async (_, res) => {
  try {
    const users = await userService.listUsers();
    res.json(users);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to list users'
    });
  }
});

// Plaid test endpoint

app.get('/api/plaid/institutions-test', async (_req, res) => {
  try {
    const countryCodes = ['US'] as CountryCode[];
    const resp = await plaidClient.institutionsGet({
      count: 1,
      offset: 0,
      country_codes: countryCodes,
    });
    res.json({ ok: true, institution: resp.data.institutions[0] });
  } catch (err: unknown) {
    const details = err instanceof Error ? err : new Error(String(err));
    console.error('Plaid ping failed:', details);
    res.status(500).json({ ok: false, error: details });
  }
});
// Create a Link token for client-side Plaid Link
app.post('/api/plaid/link-token', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ ok: false, error: 'missing user_id' });
    const data = await createLinkToken(user_id);
    res.json({ ok: true, data });
  } catch (err: unknown) {
    console.error('link-token error', err);
    const errorMsg =
      (typeof err === 'object' && err !== null && 'response' in err && (err as { response?: { data?: string } }).response?.data) ??
      (err instanceof Error ? err.message : String(err));
    res.status(500).json({ ok: false, error: errorMsg });
  }
});

// Sandbox helper: create a public_token server-side (for testing without Link)
app.post('/api/plaid/sandbox-public-token', async (req, res) => {
  try {
    const { institution_id, products } = req.body;
    const public_token = await createSandboxPublicToken(institution_id, products ?? ['transactions']);
    res.json({ ok: true, public_token });
  } catch (err: unknown) {
    console.error('sandbox-public-token error', err);
    const errorMsg =
      (typeof err === 'object' && err !== null && 'response' in err && (err as { response?: { data?: string } }).response?.data) ??
      (err instanceof Error ? err.message : String(err));
    res.status(500).json({ ok: false, error: errorMsg });
  }
});
// Exchange public_token and store access_token
app.post('/api/plaid/exchange', async (req, res) => {
  try {
    // require session user id sent by frontend
    const { public_token, user_id } = req.body as { public_token?: string; user_id?: string };
    if (!public_token || !user_id) return res.status(400).json({ ok: false, error: 'missing public_token or user_id' });

    // Exchange and store (associates item with user_id)
    const result = await exchangePublicTokenAndStore(public_token, user_id);

    // Optionally run an initial sync so Dashboard immediately sees accounts/tx
    try {
      const start = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10); // 30 days ago
      const end = new Date().toISOString().slice(0, 10); // today
      await syncToSupabase(result.access_token, user_id, start, end); // uses default 30 days if undefined
    } catch (syncErr) {
      console.warn('Initial sync failed (non-blocking):', syncErr);
    }

    res.json({ ok: true, result });
  } catch (err: unknown) {
    console.error('exchange error', err);
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});
// Sync accounts + transactions to Supabase
app.post('/api/plaid/sync', async (req, res) => {
  try {
    const { access_token, user_id, start_date, end_date } = req.body;
    if (!access_token || !user_id) return res.status(400).json({ ok: false, error: 'missing access_token or user_id' });
    const start = start_date ?? new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10); // 30 days
    const end = end_date ?? new Date().toISOString().slice(0, 10);
    const result = await syncToSupabase(access_token, user_id, start, end);
    res.json({ ok: true, result });
  } catch (err: unknown) {
    console.error('sync error', err);
    const errorMsg =
      typeof err === 'object' && err !== null && 'response' in err && typeof (err as { response?: { data?: string } }).response?.data === 'string'
        ? (err as { response?: { data?: string } }).response!.data!
        : err instanceof Error
        ? err.message
        : String(err);
    res.status(500).json({ ok: false, error: errorMsg });
  }
});
app.get('/api/plaid/accounts', async (req, res) => {
  try {
    const user_id = (req.query.user_id as string) || req.body?.user_id;
    if (!user_id) return res.status(400).json({ ok: false, error: 'missing user_id' });

    const { data, error } = await supabase
      .from('plaid_accounts')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('fetch accounts error:', error);
      return res.status(500).json({ ok: false, error: error.message ?? error });
    }

    res.json({ ok: true, data });
  } catch (err) {
    console.error('unexpected error fetching accounts:', err);
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
});
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { prompt } = req.body as { prompt: string };
    if (!prompt) return res.status(400).json({ ok: false, error: 'Missing prompt' });

    const model = gemini.getGenerativeModel({ model: GEMINI_MODEL, safetySettings: safety });
    const out = await model.generateContent(prompt);
    res.json({ ok: true, text: out.response.text() });
  } catch (err: unknown) {
    let errorMessage: string;
    if (err instanceof Error) {
        errorMessage = err.message;
    } else {
        errorMessage = String(err);
    }
    console.error('Gemini generate failed:', errorMessage);
    res.status(500).json({ ok: false, error: errorMessage });
  }
});

// 4B) Streaming variant (Server-Sent Events) — nice UX for long replies
app.get('/api/gemini/stream', async (req, res) => {
  try {
    const prompt = (req.query.prompt as string) || 'Say hello in one sentence.';
    const model = gemini.getGenerativeModel({ model: GEMINI_MODEL, safetySettings: safety });

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await model.generateContentStream({ contents: [{ role: 'user', parts: [{ text: prompt }]}] });
    for await (const evt of stream.stream) {
      // each evt has .text() when it’s a content part; guard missing
      const chunk = evt?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (chunk) res.write(`data: ${chunk}\n\n`);
    }
    res.write('event: done\ndata: [DONE]\n\n');
    res.end();
  } catch (err: unknown) {
    if (err instanceof Error) {
        console.error('Gemini stream failed:', err);
        res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    } else {
        console.error('Gemini stream failed:', err);
        res.write(`event: error\ndata: ${JSON.stringify({ error: String(err) })}\n\n`);
    }
    res.end();
    }
});

export const startServer = () => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Test endpoints:');
    console.log('- http://localhost:3001/api/health');
    console.log('- http://localhost:3001/api/test');
    console.log('- http://localhost:3001/api/db-test');
    console.log('- http://localhost:3001/api/users [GET, POST]');
    console.log('- http://localhost:3001/api/plaid/ping');
    console.log('- http://localhost:3001/api/plaid/institutions-test');
    console.log('- http://localhost:3001/api/gemini/generate [POST]');
    console.log('- http://localhost:3001/api/gemini/stream?prompt=Hello');
  });
};