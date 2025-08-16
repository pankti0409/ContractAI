import React from "react";
import Navbar from "./Navbar";
import BannerImage from "../assets/landing.jpg";

const Home = () => {
  return (
    <div className="relative h-screen w-full">
      {/* Navbar */}
      <Navbar />

      {/* Background image */}
      <img
        src={BannerImage}
        alt="Contract Analysis Dashboard"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Text content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
        <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
          Contract<span className="text-blue-400">AI</span>
        </h1>
        <br />
        <p className="mt-4 text-lg md:text-xl text-gray-200 max-w-2xl">
          AI-powered contract review that saves time, reduces risk, and ensures compliance.
        </p>
      </div>
    </div>
  );
};

export default Home;
