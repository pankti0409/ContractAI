import React from "react";
import AIPoweredReview from "../assets/react.svg";
import RiskAlerts from "../assets/react.svg";
import InteractiveDashboard from "../assets/react.svg";

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
        <p className="primary-subheading">Process</p>
        <h1 className="primary-heading">Streamlined Contract Intelligence</h1>
        <p className="primary-text">Experience seamless contract analysis through our intuitive three-step process designed for modern legal teams.
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