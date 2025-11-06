import React, { useState } from 'react';
import { supabase } from './config/supabase';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './app.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="auth-page">
      <div className="auth-container">
        <h1>FINANCIAL ASSISTANT</h1>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-row">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
              type="button"
              className="toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash/> : <FaEye/>}
            </button>
            
          <button type="submit">Login</button>
        </form>

        {message && (
          <p
            style={{
              color: isError ? 'red' : 'green',
              marginTop: '10px',
            }}
          >
            {message}
          </p>
        )}

        <p style={{ marginTop: '15px' }}>
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/signup')}
            style={{
              background: 'none',
              border: 'none',
              color: '#1a73e8',
              cursor: 'pointer',
              fontWeight: 'bold',
              textDecoration: 'underline',
              padding: 0,
              fontSize: '1rem',
            }}
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}
