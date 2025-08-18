import React from "react";
import AboutBackground from "../assets/react.svg";
import AboutBackgroundImage from "../assets/about.webp";
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
          Revolutionizing Contract Intelligence
        </h1>
        <p className="primary-text">
          Our AI-powered platform transforms how legal teams approach contract review, delivering precision and efficiency at scale.
        </p>
        <p className="primary-text">
          From automated compliance verification to intelligent risk assessment, we empower organizations to make informed decisions faster than ever before.
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