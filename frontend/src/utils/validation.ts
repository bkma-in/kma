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

export const validatePassword = (password: string): ValidationResult => {
  if (!password) return { isValid: false, message: "Password is required" };
  if (password.length !== 8) return { isValid: false, message: "Password must be exactly 8 characters" };

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return {
      isValid: false,
      message: "Include uppercase, lowercase, number, and special character"
    };
  }
  return { isValid: true };
};

/** Individual password requirement checks for real-time UI feedback */
export interface PasswordRequirement {
  label: string;
  met: boolean;
}

export const getPasswordRequirements = (password: string): PasswordRequirement[] => [
  { label: "Exactly 8 characters", met: password.length === 8 },
  { label: "One uppercase letter (A–Z)", met: /[A-Z]/.test(password) },
  { label: "One lowercase letter (a–z)", met: /[a-z]/.test(password) },
  { label: "One numeric digit (0–9)", met: /[0-9]/.test(password) },
  { label: "One special character (!@#$...)", met: /[^A-Za-z0-9]/.test(password) },
];

export const areAllPasswordRequirementsMet = (password: string): boolean =>
  getPasswordRequirements(password).every((r) => r.met);

export const getPasswordStrength = (password: string): number => {
  let strength = 0;
  if (!password) return 0;
  if (password.length === 8) strength += 25;
  if (/[A-Z]/.test(password)) strength += 25;
  if (/[a-z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 25;
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
