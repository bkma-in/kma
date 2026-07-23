import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api from './api';

const getFriendlyErrorMessage = (error: any): string => {
  const code = error.code || (error.message?.includes('auth/') ? error.message : '');
  
  if (code.includes('auth/email-already-in-use')) return 'This email is already registered. Try logging in instead.';
  if (code.includes('auth/invalid-credential')) return 'Incorrect email or password. Please try again.';
  if (code.includes('auth/user-not-found')) return 'No account found with this email.';
  if (code.includes('auth/weak-password')) return 'Password is too weak. Please use at least 6 characters.';
  if (code.includes('auth/network-request-failed')) return 'Network error. Please check your internet connection.';
  
  return error.message || 'An unexpected error occurred. Please try again.';
};

export const login = async (email: string, password: string) => {
  try {
    // Use LOCAL persistence so session survives browser close
    await setPersistence(auth, browserLocalPersistence);
    console.log('[Auth Service] Login: persistence set to LOCAL');

    // 1. Authenticate with Firebase Client
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('[Auth Service] Login: Firebase auth successful for', email);
    
    // 2. Fetch User Profile from Backend (which verifies the token and returns Role)
    const response = await api.post('/auth/verify');
    
    if (response.data.success) {
      console.log('[Auth Service] Login: Backend verified. Role:', response.data.user.role);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('role', response.data.user.role);
      localStorage.setItem('userName', response.data.user.name);
      localStorage.setItem('userEmail', response.data.user.email);
      localStorage.setItem('is_temp_password', response.data.user.mustChangePassword ? 'true' : 'false'); 
      localStorage.setItem('__kma_cached_role', response.data.user.role);
      localStorage.setItem('__kma_cached_name', response.data.user.name);
      return {
        success: true,
        user: {
          email: response.data.user.email,
          name: response.data.user.name,
          role: response.data.user.role,
          mustChangePassword: !!response.data.user.mustChangePassword
        }
      };
    }
    throw new Error('Verification failed');
  } catch (error: any) {
    console.error('[Auth Service] Login error:', error);
    throw new Error(getFriendlyErrorMessage(error));
  }
};

export const register = async (userData: any) => {
  try {
    // 1. Create User in Firebase Client
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const user = userCredential.user;
    
    // Get fresh token
    const token = await user.getIdToken();
    console.log('[Auth Service] Registration: Firebase user created, token obtained');

    // 2. Register Profile in Backend (creates Firestore document)
    const response = await api.post('/auth/register', {
      name: userData.name,
      role: userData.role // "author" or "reader"
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.data.success) {
      // Force sign out to prevent auto-login by Firebase Client SDK
      await auth.signOut();
      return { success: true };
    }
    throw new Error('Backend registration failed');
  } catch (error: any) {
    console.error('[Auth Service] Registration error details:', error.response?.data || error.message);
    throw new Error(getFriendlyErrorMessage(error));
  }
};

export const changePassword = async (newPassword: string) => {
  try {
    const response = await api.post('/auth/change-password', { newPassword });
    return response.data;
  } catch (error: any) {
    console.error('[Auth Service] Change password error:', error);
    throw new Error(error.response?.data?.error || 'Failed to change password.');
  }
};

export const sendOtp = async (email: string) => {
  try {
    const response = await api.post('/auth/forgot-password/send-otp', { email });
    return response.data;
  } catch (error: any) {
    console.error('[Auth Service] Send OTP error:', error);
    throw new Error(error.response?.data?.error || 'Failed to send verification OTP.');
  }
};

export const verifyOtp = async (email: string, otp: string) => {
  try {
    const response = await api.post('/auth/forgot-password/verify-otp', { email, otp });
    return response.data;
  } catch (error: any) {
    console.error('[Auth Service] Verify OTP error:', error);
    throw new Error(error.response?.data?.error || 'Failed to verify verification code.');
  }
};

export const resetPassword = async (email: string, resetToken: string, newPassword: string) => {
  try {
    const response = await api.post('/auth/forgot-password/reset', { email, resetToken, newPassword });
    return response.data;
  } catch (error: any) {
    console.error('[Auth Service] Reset password error:', error);
    throw new Error(error.response?.data?.error || 'Failed to reset password.');
  }
};
