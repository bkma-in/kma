import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from './api';

export const login = async (email: string, password: string) => {
  try {
    // 1. Authenticate with Firebase Client
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // 2. Fetch User Profile from Backend (which verifies the token and returns Role)
    const response = await api.post('/auth/verify');
    
    if (response.data.success) {
      return {
        success: true,
        user: {
          email: response.data.user.email,
          name: response.data.user.name || email.split('@')[0], // Backend might not return name directly yet, but it's in DB
          role: response.data.user.role
        }
      };
    }
    throw new Error('Verification failed');
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Invalid credentials');
  }
};

export const register = async (userData: any) => {
  try {
    // 1. Create User in Firebase Client
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    
    // 2. Register Profile in Backend (creates Firestore document)
    const response = await api.post('/auth/register', {
      name: userData.name,
      role: userData.role // "author" or "reader"
    });

    if (response.data.success) {
      return { success: true };
    }
    throw new Error('Backend registration failed');
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Failed to register');
  }
};
