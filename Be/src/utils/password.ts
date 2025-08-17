import crypto from 'crypto';

export const hashPassword = async (password: string): Promise<string> => {
  try {
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString('hex');
    // Hash password with salt using pbkdf2
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    // Return salt and hash combined
    return `${salt}:${hash}`;
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    // Check if it's the new crypto format (contains ':')
    if (hashedPassword.includes(':')) {
      // New crypto format
      const [salt, hash] = hashedPassword.split(':');
      if (!salt || !hash) {
        return false;
      }
      // Hash the provided password with the same salt
      const hashToCompare = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      // Compare hashes
      return hash === hashToCompare;
    } else {
      // Legacy bcrypt format - use simple string comparison for now
      // In production, you might want to gradually migrate users to new format
      return false; // Force users to reset password if using old format
    }
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common and easily guessable');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};