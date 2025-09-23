import express from 'express';
import cors from 'cors';
import { supabase } from './config/supabase';
import { userService } from './services/userService'; // Make sure this path is correct

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

export const startServer = () => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Test endpoints:');
    console.log('- http://localhost:3001/api/health');
    console.log('- http://localhost:3001/api/test');
    console.log('- http://localhost:3001/api/db-test');
    console.log('- http://localhost:3001/api/users [GET, POST]');
  });
};