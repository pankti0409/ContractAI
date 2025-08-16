import React from 'react';
import { FiShield, FiClock, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';

const Features = () => {
  const features = [
    {
      icon: <FiShield />,
      title: 'Risk Mitigation',
      description: 'Advanced AI algorithms identify potential legal risks and compliance issues before they become problems, protecting your business interests.'
    },
    {
      icon: <FiClock />,
      title: 'Time Efficiency',
      description: 'Reduce contract review time from hours to minutes. Our AI processes complex legal documents with unprecedented speed and accuracy.'
    },
    {
      icon: <FiCheckCircle />,
      title: 'Compliance Assurance',
      description: 'Stay compliant with ever-changing regulations. Our system continuously updates to reflect the latest legal requirements and standards.'
    }
  ];

  return (
    <section className="features-section">
      <div className="features-container">
        <div className="primary-subheading">Why Choose ContractAI</div>
        <h2 className="primary-heading">Intelligent Solutions for Modern Legal Workflows</h2>
        <p className="primary-text">
          Experience the future of contract management with our AI-powered platform designed for legal professionals who demand excellence.
        </p>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;