import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './Login';
import SignUp from './SignUp';
import Dashboard from './Dashboard';
import ChatPage from './Chat';
import PlaidConnect from './PlaidConnect';
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plaid"
          element={
            <ProtectedRoute>
              <PlaidConnect />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;