
import React, { useState } from 'react';
import { supabase } from './config/supabase';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './app.css';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        navigate('/');
      }, 3000); // Optional: redirect to login after showing message
    }
  };

   return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>CREATE ACCOUNT</h1>

        <form onSubmit={handleSignUp}>
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
              placeholder="Password (min 6 characters)"
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

          <button type="submit">Sign Up</button>
        </form>

        {message && (
          <p style={{ color: isError ? 'red' : 'green', marginTop: '10px' }}>
            {message}
          </p>
        )}

        <p style={{ marginTop: '15px' }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/')}
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
            Back to Login
          </button>
        </p>
      </div>
    </div>
  );
}