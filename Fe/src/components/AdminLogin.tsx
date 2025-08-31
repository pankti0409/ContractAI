import React, { useState } from 'react';
import { FiEye, FiEyeOff, FiUser, FiLock, FiShield } from 'react-icons/fi';
import adminService from '../services/adminService';
import './AdminPanel.css';

interface AdminLoginProps {
  onLoginSuccess: (token: string) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

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
    <div className="admin-container">
      <div className="admin-login-form">
        <h2>Admin Login</h2>
        <p>ContractAI Administration Panel</p>
        
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className="admin-input"
              placeholder="Enter admin username"
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="password">Password</label>
            <div className="admin-password-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="admin-input"
                placeholder="Enter admin password"
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {error && <div className="admin-error">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="admin-login-button"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;