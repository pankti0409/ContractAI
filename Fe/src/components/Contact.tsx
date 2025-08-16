import React from "react";

const Contact = () => {
  return (
    <div id="contact" className="contact-page-wrapper">
      <h1 className="primary-heading">Have Question In Mind?</h1>
      <h1 className="primary-heading">Let Us Help You</h1>
      
      {/* Writing Portion */}
      <div className="contact-writing-section">
        <p className="primary-text">
          We're here to assist you with any questions or concerns you may have about our AI-powered contract review platform. 
          Whether you need technical support, want to learn more about our features, or are interested in a custom solution 
          for your organization, our team is ready to help.
        </p>
        <p className="primary-text">
          Get in touch with us today and discover how ContractAI can transform your legal workflow with intelligent 
          contract analysis, risk assessment, and compliance verification.
        </p>
      </div>
      
      <div className="contact-form-container">
        <input type="text" placeholder="yourmail@gmail.com" />
        <button className="secondary-button">Submit</button>
      </div>
    </div>
  );
};

export default Contact;