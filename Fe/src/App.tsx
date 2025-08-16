import React, { useState } from 'react';
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

  // If user is authenticated, show chat interface
  if (isAuthenticated) {
    return (
      <>
        <ChatInterface />
      </>
    );
  }

  // Otherwise, show landing page
  return (
    <div className='App'>
      <Home 
        setShowLoginModal={setShowLoginModal} 
        setShowSignUpModal={setShowSignUpModal} 
      />
      <Features />
      <About setShowSignUpModal={setShowSignUpModal} />
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
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App
