import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './config/supabase';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import { keyframes } from '@mui/system';

type Msg = { id: string; sender: 'user' | 'assistant'; text: string };

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// Typing animation for loading indicator
const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
`;

const TypingIndicator = () => (
  <Box sx={{ display: 'flex', gap: 0.5, p: 1 }}>
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: '#999',
          animation: `${bounce} 1.4s infinite ease-in-out both`,
          animationDelay: `${i * 0.16}s`,
        }}
      />
    ))}
  </Box>
);

export default function ChatPage() {
  const navigate = useNavigate();
  const [loadingSession, setLoadingSession] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        navigate('/');
        return;
      }
      setLoadingSession(false);
    })();
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const pushMessage = (msg: Msg) => setMessages((m) => [...m, msg]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    const userMsg: Msg = { id: String(Date.now()) + '-u', sender: 'user', text };
    pushMessage(userMsg);
    setSending(true);

    try {
      const { data } = await supabase.auth.getSession();
      const userId = data?.session?.user?.id;
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, user_id: userId }),
      });
      const json = await res.json();
      if (!res.ok) {
        pushMessage({
          id: String(Date.now()) + '-e',
          sender: 'assistant',
          text: `Error: ${json?.error ?? 'Chat failed'}`,
        });
      } else {
        pushMessage({
          id: String(Date.now()) + '-a',
          sender: 'assistant',
          text: json.text ?? 'No response',
        });
      }
    } catch (err) {
      pushMessage({
        id: String(Date.now()) + '-e',
        sender: 'assistant',
        text: `Error: ${String(err)}`,
      });
    } finally {
      setSending(false);
    }
  };

  if (loadingSession) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fafafa',
      }}
    >
      {/* Header - Fixed at top */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid #e0e0e0',
          px: 4,
          py: 2.5,
        }}
      >
        <Typography variant="h5" fontWeight={600} sx={{ mb: 0.5 }}>
          AI Financial Assistant
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ask questions about your accounts, spending, or get financial advice
        </Typography>
      </Box>

      {/* Messages Area - Scrollable */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          px: 4,
          py: 3,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ maxWidth: 800, width: '100%', margin: '0 auto' }}>
          {messages.length === 0 && !sending && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '50vh',
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
                Welcome to your Financial Assistant
              </Typography>
              <Typography variant="body2">
                Start by asking about your account balances, spending habits, or financial goals
              </Typography>
            </Box>
          )}

          {messages.map((m) => (
            <Box
              key={m.id}
              sx={{
                display: 'flex',
                justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  maxWidth: '75%',
                  bgcolor: m.sender === 'user' ? '#0b5cff' : '#fff',
                  color: m.sender === 'user' ? '#fff' : '#1a1a1a',
                  borderRadius: 3,
                  wordWrap: 'break-word',
                  border: m.sender === 'assistant' ? '1px solid #e0e0e0' : 'none',
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {m.text}
                </Typography>
              </Paper>
            </Box>
          ))}

          {sending && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  bgcolor: '#fff',
                  borderRadius: 3,
                  border: '1px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <TypingIndicator />
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>
      </Box>

      {/* Input Area - Fixed at bottom */}
      <Box
        sx={{
          bgcolor: 'white',
          borderTop: '1px solid #e0e0e0',
          px: 4,
          py: 2,
        }}
      >
        <Box sx={{ maxWidth: 800, width: '100%', margin: '0 auto', display: 'flex', gap: 1.5 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={sending}
            multiline
            maxRows={4}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#fafafa',
                borderRadius: 3,
                '& fieldset': {
                  borderColor: '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: '#bdbdbd',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0b5cff',
                },
              },
            }}
          />
          <IconButton
            onClick={send}
            disabled={sending || !input.trim()}
            sx={{
              bgcolor: '#0b5cff',
              color: 'white',
              width: 56,
              height: 56,
              borderRadius: 3,
              '&:hover': {
                bgcolor: '#0a4fd6',
              },
              '&:disabled': {
                bgcolor: '#e0e0e0',
                color: '#9e9e9e',
              },
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}