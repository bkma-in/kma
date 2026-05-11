import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence 
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
    // 0. Set Persistence to Session (Clears on browser close)
    await setPersistence(auth, browserSessionPersistence);

    // 1. Authenticate with Firebase Client
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // 2. Fetch User Profile from Backend (which verifies the token and returns Role)
    const response = await api.post('/auth/verify');
    
    if (response.data.success) {
      return {
        success: true,
        user: {
          email: response.data.user.email,
          name: response.data.user.name || email.split('@')[0],
          role: response.data.user.role
        }
      };
    }
    throw new Error('Verification failed');
  } catch (error: any) {
    console.error('Login error:', error);
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
    console.log('Registration: Firebase user created, token obtained');

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
      return { success: true };
    }
    throw new Error('Backend registration failed');
  } catch (error: any) {
    console.error('Registration error details:', error.response?.data || error.message);
    throw new Error(getFriendlyErrorMessage(error));
  }
};
