import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";

interface HomeProps {
  setShowLoginModal: (show: boolean) => void;
  setShowSignUpModal: (show: boolean) => void;
}

const Home: React.FC<HomeProps> = ({ setShowLoginModal, setShowSignUpModal }) => {
  const [showNavbar, setShowNavbar] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [typedText, setTypedText] = useState('');
  const fullText = 'ContractAI';

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 100 && !hasScrolled) {
        setHasScrolled(true);
        setShowNavbar(true);
      } else if (hasScrolled) {
        setShowNavbar(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolled]);

  useEffect(() => {
    // Show content after a brief delay
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 500);

    // Typing effect for the title
    const typingTimer = setTimeout(() => {
      let index = 0;
      const typeInterval = setInterval(() => {
        if (index < fullText.length) {
          setTypedText(fullText.slice(0, index + 1));
          index++;
        } else {
          clearInterval(typeInterval);
        }
      }, 150);
    }, 1000);

    return () => {
      clearTimeout(contentTimer);
      clearTimeout(typingTimer);
    };
  }, []);

  return (
    <div id="home" className="relative">
      {/* Navbar - fixed position, shows on scroll */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out transform ${
        showNavbar ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
        <Navbar setShowLoginModal={setShowLoginModal} setShowSignUpModal={setShowSignUpModal} />
      </div>

      {/* Video Background - full viewport */}
      <div className="relative w-full h-screen">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/assets/video/vecteezy_business-and-lawyers-discussing-contract-papers-with-brass_28300035.MOV" type="video/mp4" />
        </video>

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Text content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
          {/* Animated title with typing effect */}
          <div className={`transition-all duration-1000 ease-out transform ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-white drop-shadow-2xl">
              {typedText.split('').map((char, index) => (
                <span 
                  key={index}
                  className={`inline-block ${
                    char === 'A' && index === typedText.length - 1 ? 'text-blue-400' : ''
                  } ${index < 8 ? '' : 'text-blue-400'}`}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  {char}
                </span>
              ))}
              {typedText.length < fullText.length && (
                <span className="animate-pulse text-blue-400">|</span>
              )}
            </h1>
          </div>
          
          {/* Animated subtitle */}
          <div className={`transition-all duration-1000 delay-1000 ease-out transform ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <p className="mt-8 text-2xl md:text-3xl lg:text-4xl text-gray-100 max-w-4xl font-medium drop-shadow-lg">
              AI-powered contract review that saves time, reduces risk, and ensures compliance.
            </p>
          </div>

        </div>
      </div>


    </div>
  );
};

export default Home;
