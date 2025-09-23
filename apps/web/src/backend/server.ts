import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' });
});

export const startServer = () => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};