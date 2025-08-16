import React from "react";
import { FiCpu, FiAlertTriangle, FiBarChart } from "react-icons/fi";

const Work = () => {
  const workInfoData = [
    {
      icon: <FiCpu />,
      title: "AI-Powered Review",
      text: "Our system uses NLP to extract clauses, detect risky language, and perform compliance checks automatically.",
    },
    {
      icon: <FiAlertTriangle />,
      title: "Risk Alerts",
      text: "Contracts are analyzed and risk alerts are flagged for non-standard or risky terms.",
    },
    {
      icon: <FiBarChart />,
      title: "Interactive Dashboard",
      text: "Legal teams access a visual dashboard with insights, clause summaries, semantic similarity checks, and overall compliance scores.",
    },
  ];
  return (
    <div id="work" className="work-section-wrapper">
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
              {data.icon}
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