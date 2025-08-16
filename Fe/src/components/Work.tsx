import React from "react";
import AIPoweredReview from "../Assets/react.svg";
import RiskAlerts from "../Assets/react.svg";
import InteractiveDashboard from "../Assets/react.svg";

const Work = () => {
  const workInfoData = [
    {
      image: AIPoweredReview,
      title: "AI-Powered\n Review",
      text: "Our system uses NLP to extract clauses, detect risky language, and perform compliance checks automatically.",
    },
    {
      image: RiskAlerts,
      title: "Risk Alerts",
      text: "Contracts are analyzed and risk alerts are flagged for non-standard or risky terms.",
    },
    {
      image: InteractiveDashboard,
      title: "Interactive Dashboard",
      text: "Legal teams access a visual dashboard with insights, clause summaries, semantic similarity checks, and overall compliance scores.",
    },
  ];
  return (
    <div className="work-section-wrapper">
      <div className="work-section-top">
        <p className="primary-subheading">Work</p>
        <h1 className="primary-heading">How It Works</h1>
        <p className="primary-text">Users securely upload contracts or legal documents to
          the platform through the responsive web app.
        </p>
      </div>
      <div className="work-section-bottom">
        {workInfoData.map((data) => (
          <div className="work-section-info" key={data.title}>
            <div className="info-boxes-img-container">
              <img src={data.image} alt="" />
            </div>
            <h2>{data.title}</h2>
            <p>{data.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Work;