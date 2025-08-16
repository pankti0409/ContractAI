import React from "react";
import { BsTwitter, BsYoutube } from "react-icons/bs";
import { SiLinkedin } from "react-icons/si";
import { FaFacebookF } from "react-icons/fa";
import Logo from "../Assets/react.svg";

const Footer = () => {
  return (
    <footer className="px-8 md:px-20 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Logo & About */}
        <div>
          <img src={Logo} alt="Logo" className="w-14 mb-4" />
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-3 text-gray-400">
            <li><a href="/" className="hover:text-white">Home</a></li>
            <li><a href="/about" className="hover:text-white">About</a></li>
            <li><a href="/contact" className="hover:text-white">Contact</a></li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Resources</h3>
          <ul className="space-y-3 text-gray-400">
            <li><a href="/docs">Documentation</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/terms">Terms & Conditions</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Contact</h3>
          <p className="text-gray-400">📞 +91 9227448882</p>
          <a
            href="mailto:aaleya2604@gmail.com"
            className="text-gray-400 block"
          >
            aaleya2604@gmail.com
          </a>
          <div className="flex space-x-5 mt-5 text-gray-400 text-xl">
            <a href="#"><BsTwitter  /></a>
            <a href="#"><SiLinkedin  /></a>
            <a href="#"><BsYoutube/></a>
            <a href="#"><FaFacebookF/></a>
          </div>
        </div>
      </div>
      <br />

      {/* Bottom Section */}
      <div className="mt-12 pt-6 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Compliance Review Platform. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
