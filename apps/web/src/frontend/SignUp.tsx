
import React, { useState } from 'react';
import { supabase } from './config/supabase';
import { useNavigate } from 'react-router-dom';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      setMessage(error.message);
      setIsError(true);
    } else {
      setMessage('Signup for Finance Assistant successful! Please check your email to confirm.');
      setIsError(false);
      setTimeout(() => {
        navigate('/login');
      }, 3000); // Optional: redirect to login after showing message
    }
  };

  return (
    <form onSubmit={handleSignUp}>
      <h2>Sign Up</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password (min 6 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Sign Up</button>

      {message && (
        <p style={{ color: isError ? 'red' : 'green', marginTop: '10px' }}>
          {message}
        </p>
      )}

      <p>
        Already have an account?{' '}
        <button type="button" onClick={() => navigate('/')}>
          Back to Login
        </button>
      </p>
    </form>
  );
}
