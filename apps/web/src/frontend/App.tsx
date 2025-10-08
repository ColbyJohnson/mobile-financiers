import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import SignUp from './SignUp';
import Dashboard from './Dashboard';
import ChatPage from './Chat';
import PlaidConnect from './PlaidConnect';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<ChatPage />} /> 
        <Route path="/plaid" element={<PlaidConnect />} />  
      </Routes>
    </Router>
  );
}

export default App;
