/**
 * Utility functions for authentication management
 */

/**
 * Clears only authentication-related data from localStorage, preserving chat data
 * This function should be used when session validation fails but user data should be preserved
 */
export const clearAuthDataOnly = (): void => {
  // Clear only authentication-related data from localStorage
  localStorage.removeItem('user');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  
  console.log('Authentication data cleared from localStorage (chat data preserved)');
};

/**
 * Clears all authentication-related data from localStorage
 * This function can be called from anywhere in the application
 * @param preserveChatData - If true, preserves chat data; if false, clears everything
 */
export const clearAuthData = (preserveChatData: boolean = false): void => {
  // Clear all authentication-related data from localStorage
  localStorage.removeItem('user');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  
  if (!preserveChatData) {
    // Clear any remaining chat-related data to prevent data mixing between users
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('chatMessages_') || key.startsWith('chatFiles_') || key === 'currentChatId') {
        localStorage.removeItem(key);
      }
    });
    console.log('Authentication and chat data cleared from localStorage');
  } else {
    console.log('Authentication data cleared from localStorage (chat data preserved)');
  }
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
 * @param preserveChatData - If true, preserves chat data; if false, clears everything
 */
export const clearAuthDataAndNotify = (preserveChatData: boolean = false): void => {
  clearAuthData(preserveChatData);
  notifyAuthChange();
};

/**
 * Clears only authentication data (preserving chat data) and notifies components
 * This should be used when session validation fails but we want to keep user's chat data
 */
export const clearAuthDataOnlyAndNotify = (): void => {
  clearAuthDataOnly();
  notifyAuthChange();
};