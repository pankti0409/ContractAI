import React from "react";
import AboutBackground from "../Assets/react.svg";
import AboutBackgroundImage from "../Assets/about.webp";
import { BsFillPlayCircleFill } from "react-icons/bs";

const About = () => {
  return (
    <div className="about-section-container">
      <div className="about-background-image-container">
        <img src={AboutBackground} alt="" />
      </div>
      <div className="about-section-image-container">
        <img src={AboutBackgroundImage} alt="" />
      </div>
      <div className="about-section-text-container">
        <p className="primary-subheading">About</p>
        <h1 className="primary-heading">
          Why ContractAI?
        </h1>
        <p className="primary-text">
          The Automated Compliance and Contract Review Service is an AI-powered platform designed to assist legal teams in reviewing contracts efficiently. 
        </p>
        <p className="primary-text">
          It automates compliance checks, extracts and classifies key clauses, detects risky or non-standard language, and provides insights through an interactive dashboard.
        </p>
        <div className="about-buttons-container">
          <button className="secondary-button">Get Started</button>
          <button className="watch-video-button">
            <BsFillPlayCircleFill /> Watch Video
          </button>
        </div>
      </div>
    </div>
  );
};

export default About;