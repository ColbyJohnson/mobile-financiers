import React, { useState } from 'react';
import { supabase } from './config/supabase';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      setMessage(error.message);
      setIsError(true);
    } else {
      setMessage('Login successful! Redirecting to your Dashboard');
      setIsError(false);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500); // Delay to show message before redirect
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Login</button>

      {message && (
        <p style={{ color: isError ? 'red' : 'green', marginTop: '10px' }}>
          {message}
        </p>
      )}

      <p>
        Don't have an account?{' '}
        <button type="button" onClick={() => navigate('/signup')}>
          Sign Up
        </button>
      </p>
    </form>
  );
}
