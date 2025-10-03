import express from 'express';
import cors from 'cors';
import { supabase } from './config/supabase';
import { userService } from './services/userService'; // Make sure this path is correct
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