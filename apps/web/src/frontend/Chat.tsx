import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './config/supabase';

type Msg = { id: string; sender: 'user' | 'assistant'; text: string };

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export default function ChatPage() {
  const navigate = useNavigate();
  const [loadingSession, setLoadingSession] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        navigate('/'); // Not logged in -> send to login
        return;
      }
      setLoadingSession(false);
    })();
  }, [navigate]);

  const pushMessage = (msg: Msg) => setMessages((m) => [...m, msg]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    const userMsg: Msg = { id: String(Date.now()) + '-u', sender: 'user', text };
    pushMessage(userMsg);
    setSending(true);

    try {
      // Simple non-streaming call to backend LLM endpoint
      const res = await fetch(`${apiUrl}/api/gemini/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      const json = await res.json();
      if (!res.ok) {
        const err = json?.error ?? json;
        pushMessage({ id: String(Date.now()) + '-e', sender: 'assistant', text: `Error: ${err}` });
      } else {
        const assistantText = json.text ?? (json?.result ?? JSON.stringify(json));
        pushMessage({ id: String(Date.now()) + '-a', sender: 'assistant', text: assistantText });
      }
    } catch (err) {
      pushMessage({ id: String(Date.now()) + '-e', sender: 'assistant', text: String(err) });
    } finally {
      setSending(false);
    }
  };

  if (loadingSession) return <div>Checking session...</div>;

  return (
    <div style={{ maxWidth: 720, margin: '1rem auto', padding: '1rem', background: 'rgba(255,255,255,0.9)', borderRadius: 8 }}>
      <h2>Chat</h2>
      <div style={{ height: 360, overflow: 'auto', border: '1px solid #ddd', padding: 12, borderRadius: 6, background: '#fff' }}>
        {messages.length === 0 && <div style={{ color: '#777' }}>No messages yet. Say hello!</div>}
        {messages.map((m) => (
          <div key={m.id} style={{ margin: '8px 0', textAlign: m.sender === 'user' ? 'right' : 'left' }}>
            <div style={{
              display: 'inline-block',
              padding: '8px 12px',
              borderRadius: 16,
              background: m.sender === 'user' ? '#0b5cff' : '#f1f1f1',
              color: m.sender === 'user' ? '#fff' : '#111',
              maxWidth: '80%',
              whiteSpace: 'pre-wrap'
            }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
        />
        <button onClick={send} disabled={sending} style={{ padding: '8px 12px', borderRadius: 6 }}>
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}