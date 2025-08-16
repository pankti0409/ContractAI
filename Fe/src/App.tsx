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

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  const handleSwitchToSignUp = () => {
    setShowLoginModal(false);
    setShowSignUpModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignUpModal(false);
    setShowLoginModal(true);
  };

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

export default App
