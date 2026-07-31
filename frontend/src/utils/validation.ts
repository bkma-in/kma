export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const validateName = (name: string): ValidationResult => {
  if (!name) return { isValid: false, message: "Name is required" };
  if (name.length < 3) return { isValid: false, message: "Name must be at least 3 characters" };
  return { isValid: true };
};

export const validateEmail = (email: string): ValidationResult => {
  if (!email) return { isValid: false, message: "Email is required" };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { isValid: false, message: "Invalid email format" };
  return { isValid: true };
};

export interface PasswordValidationResult {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  isValid: boolean;
  message?: string;
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  let message: string | undefined;
  if (!password) {
    message = "Password is required";
  } else if (!hasMinLength) {
    message = "Password must be at least 8 characters";
  } else if (!isValid) {
    message = "Password requirements not met";
  }

  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    isValid,
    message
  };
};

export const getPasswordStrength = (password: string): number => {
  let strength = 0;
  if (!password) return 0;
  const result = validatePassword(password);
  if (result.hasMinLength) strength += 20;
  if (result.hasUppercase) strength += 20;
  if (result.hasLowercase) strength += 20;
  if (result.hasNumber) strength += 20;
  if (result.hasSpecialChar) strength += 20;
  return strength;
};

export type Role = 'admin' | 'reviewer' | 'author' | 'reader' | 'dev';
export type Status = 'approved' | 'pending' | 'rejected';

export interface RegistrationData {
  name: string;
  email: string;
  role: Role;
  status: Status;
}
