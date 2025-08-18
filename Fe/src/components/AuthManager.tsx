import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { clearAuthDataAndNotify } from '../utils/authUtils';

/**
 * AuthManager component provides utilities for managing authentication state
 * This can be used for debugging or administrative purposes
 */
const AuthManager: React.FC = () => {
  const { clearAuthData, isAuthenticated, user } = useAuth();

  const handleClearLocalStorage = () => {
    if (window.confirm('Are you sure you want to clear all authentication data? This will log you out.')) {
      clearAuthData();
    }
  };

  const handleForceRefresh = () => {
    if (window.confirm('This will clear authentication data and refresh the page. Continue?')) {
      clearAuthDataAndNotify(false); // Clear everything including chat data for force refresh
      window.location.reload();
    }
  };

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#f0f0f0',
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '250px'
    }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Auth Manager (Dev)</h4>
      <div style={{ marginBottom: '8px' }}>
        <strong>Status:</strong> {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      {user && (
        <div style={{ marginBottom: '8px' }}>
          <strong>User:</strong> {user.email}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
        <button
          onClick={handleClearLocalStorage}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            background: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Auth Data
        </button>
        <button
          onClick={handleForceRefresh}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            background: '#4ecdc4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear & Refresh
        </button>
      </div>
    </div>
  );
};

export default AuthManager;