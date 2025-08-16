/**
 * Utility functions for authentication management
 */

/**
 * Clears all authentication-related data from localStorage
 * This function can be called from anywhere in the application
 */
export const clearAuthData = (): void => {
  // Clear all authentication-related data from localStorage
  localStorage.removeItem('user');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  
  console.log('Authentication data cleared from localStorage');
};

/**
 * Checks if user is authenticated based on localStorage
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('accessToken');
  const authStatus = localStorage.getItem('isAuthenticated');
  return !!(token && authStatus === 'true');
};

/**
 * Gets the current access token from localStorage
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

/**
 * Dispatches a custom event to notify components about auth state changes
 * This allows components to react to authentication changes made outside of React context
 */
export const notifyAuthChange = (): void => {
  window.dispatchEvent(new CustomEvent('authStateChanged'));
};

/**
 * Clears authentication data and notifies components
 */
export const clearAuthDataAndNotify = (): void => {
  clearAuthData();
  notifyAuthChange();
};