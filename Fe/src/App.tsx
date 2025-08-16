import './App.css'
import Home from './components/Home'
import About from './components/About'
import Features from './components/Features'
import Work from './components/Work'
import Testimonial from './components/Testimonial'
import Contact from './components/Contact'
import Footer from './components/Footer'
import ChatInterface from './components/ChatInterface'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Landing Page Component
const LandingPage = () => {
  return (
    <div className='App'>
      <section id="home">
        <Home/>
      </section>
      <section id="features">
        <Features/>
      </section>
      <section id="about">
        <About/>
      </section>
      <section id="work">
        <Work/>
      </section>
      <section id="contact">
        <Contact/>
      </section>
      <Footer/>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<ChatInterface />} />
      </Routes>
    </Router>
  )
}

export default App
