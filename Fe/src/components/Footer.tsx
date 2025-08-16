import React from "react";
import { BsTwitter, BsYoutube } from "react-icons/bs";
import { SiLinkedin } from "react-icons/si";
import { FaFacebookF } from "react-icons/fa";
import Logo from "../Assets/react.svg";

const Footer = () => {
  return (
    <footer className="impressive-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Logo & About */}
          <div className="footer-brand">
            <div className="footer-logo-container">
              <img src={Logo} alt="ContractAI Logo" className="footer-logo" />
              <h3 className="brand-name">ContractAI</h3>
            </div>
            <p className="brand-description">
              Revolutionizing legal workflows with AI-powered contract analysis and compliance verification.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-column">
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-links">
              <li><a href="#home" className="footer-link">Home</a></li>
              <li><a href="#about" className="footer-link">About</a></li>
              <li><a href="#features" className="footer-link">Features</a></li>
              <li><a href="#work" className="footer-link">Services</a></li>
              <li><a href="#contact" className="footer-link">Contact</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-column">
            <h3 className="footer-title">Resources</h3>
            <ul className="footer-links">
              <li><a href="#docs" className="footer-link">Documentation</a></li>
              <li><a href="#api" className="footer-link">API Reference</a></li>
              <li><a href="#privacy" className="footer-link">Privacy Policy</a></li>
              <li><a href="#terms" className="footer-link">Terms & Conditions</a></li>
              <li><a href="#support" className="footer-link">Support Center</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-column">
            <h3 className="footer-title">Get In Touch</h3>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <span className="contact-text">+91 9227448882</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">✉️</span>
                <a href="mailto:aaleya2604@gmail.com" className="contact-link">
                  aaleya2604@gmail.com
                </a>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <span className="contact-text">Mumbai, India</span>
              </div>
            </div>
            <div className="social-media">
              <h4 className="social-title">Follow Us</h4>
              <div className="social-icons">
                <a href="#" className="social-icon twitter"><BsTwitter /></a>
                <a href="#" className="social-icon linkedin"><SiLinkedin /></a>
                <a href="#" className="social-icon youtube"><BsYoutube /></a>
                <a href="#" className="social-icon facebook"><FaFacebookF /></a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <div className="footer-divider"></div>
          <div className="footer-bottom-content">
            <p className="copyright">
              © {new Date().getFullYear()} ContractAI - Compliance Review Platform. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <a href="#privacy" className="bottom-link">Privacy</a>
              <a href="#terms" className="bottom-link">Terms</a>
              <a href="#cookies" className="bottom-link">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
