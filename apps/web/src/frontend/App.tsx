import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './Login';
import SignUp from './SignUp';
import Layout from './Layout';
import Dashboard from './Dashboard';
import ChatPage from './Chat';
import PlaidConnect from './PlaidConnect';
import ProtectedRoute from './ProtectedRoute';
import SettingsPage from './Settings';
import { SettingsProvider } from "./SettingsGlobal";

function App() {
  return (
    // 🔥 Wrap entire app so dark mode / contrast / font size apply globally
    <SettingsProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Protected layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/plaid" element={<PlaidConnect />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </SettingsProvider>
  );
}

export default App;
