import React, { useState, useEffect } from 'react';
import { FiEye, FiEyeOff, FiUser, FiLock, FiShield, FiAlertCircle } from 'react-icons/fi';
import adminService from '../services/adminService';
import './AdminPanel.css';

interface AdminLoginProps {
  onLoginSuccess: (token: string) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const isAvailable = await adminService.checkBackendStatus();
      setBackendStatus(isAvailable ? 'available' : 'unavailable');
    } catch (error) {
      setBackendStatus('unavailable');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = await adminService.login(formData);

      if (result.success) {
        const token = result.token || result.data?.token;
        if (token) {
          onLoginSuccess(token);
        } else {
          setError('Login successful but no token received');
        }
      } else {
        setError(result.message || 'Invalid credentials');
      }
    } catch (err: any) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-hero">
      {/* Video Background */}
      <video
        className="admin-login-video"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/assets/video/vecteezy_business-and-lawyers-discussing-contract-papers-with-brass_28300035.MOV" type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="admin-login-overlay" />

      {/* Content */}
      <div className="admin-login-content">
        {/* Logo */}
        <div className="admin-login-logo">
          <h1>
            <span className="logo-contract">Contract</span>
            <span className="logo-ai">AI</span>
          </h1>
          <p>Administration Panel</p>
        </div>

        {/* Backend Status Warning */}
        {backendStatus === 'unavailable' && (
          <div className="admin-backend-warning">
            <FiAlertCircle size={24} />
            <div>
              <h3>Backend Server Unavailable</h3>
              <p>The admin panel requires the backend server to be running on port 3001.</p>
              <p>Please start your backend server and try again.</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="admin-login-form-container">
          <div className="admin-login-form-card">
            <div className="admin-login-form-header">
              <FiShield size={48} className="admin-login-icon" />
              <h2>Admin Access</h2>
              <p>Sign in to manage ContractAI</p>
            </div>
            
            <form onSubmit={handleSubmit} className="admin-login-form">
              <div className="admin-input-group">
                <div className="admin-input-wrapper">
                  <FiUser className="admin-input-icon" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className="admin-input-field"
                    placeholder="Enter admin username"
                    disabled={backendStatus === 'unavailable'}
                  />
                </div>
              </div>

              <div className="admin-input-group">
                <div className="admin-input-wrapper">
                  <FiLock className="admin-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="admin-input-field"
                    placeholder="Enter admin password"
                    disabled={backendStatus === 'unavailable'}
                  />
                  <button
                    type="button"
                    className="admin-password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={backendStatus === 'unavailable'}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              {error && <div className="admin-error-message">{error}</div>}

              <button
                type="submit"
                disabled={isLoading || backendStatus === 'unavailable'}
                className="admin-login-btn"
              >
                {isLoading ? 'Signing in...' : 'Sign In to Admin Panel'}
              </button>
            </form>

            <div className="admin-login-demo">
              <p>
                <strong>Demo Credentials:</strong><br />
                Username: <code>admin</code><br />
                Password: <code>admin123</code>
              </p>
            </div>
          </div>
        </div>

        {/* Back to Main App */}
        <div className="admin-login-back">
          <a href="/" className="admin-back-link">
            ← Back to Main Application
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;