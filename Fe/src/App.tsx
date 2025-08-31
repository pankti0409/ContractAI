import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Features from './components/Features';
import About from './components/About';
import Work from './components/Work';
import Contact from './components/Contact';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import SignUpModal from './components/SignUpModal';
import ChatInterface from './components/ChatInterface';
import AdminPanel from './components/AdminPanel';

import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  // Show loading spinner while auth is being initialized
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const handleSwitchToSignUp = () => {
    setShowLoginModal(false);
    setShowSignUpModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignUpModal(false);
    setShowLoginModal(true);
  };

  return (
    <Routes>
      <Route path="/chat" element={
        isAuthenticated ? <ChatInterface /> : <Navigate to="/" replace />
      } />
      <Route path="/" element={
        isAuthenticated ? (
          <Navigate to="/chat" replace />
        ) : (
          <div className='App'>
            <Home 
              setShowLoginModal={setShowLoginModal}
              setShowSignUpModal={setShowSignUpModal}
            />
            <Features />
            <About />
            <Work />
            <Contact />
            <Footer />
            
            <LoginModal 
              isOpen={showLoginModal}
              onClose={() => setShowLoginModal(false)}
              onSwitchToSignUp={handleSwitchToSignUp}
            />
            
            <SignUpModal 
              isOpen={showSignUpModal}
              onClose={() => setShowSignUpModal(false)}
              onSwitchToLogin={handleSwitchToLogin}
            />
          </div>
        )
      } />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin route - independent of main auth */}
        <Route path="/admin" element={<AdminPanel />} />
        
        {/* Main app routes - wrapped with AuthProvider */}
        <Route path="/*" element={
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        } />
      </Routes>
    </Router>
  );
}

export default App
