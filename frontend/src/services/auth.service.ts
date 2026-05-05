/**
 * Mock Auth Service
 * In a real application, these functions would make API calls to the backend.
 */

export const login = async (email: string, password: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock validation
  if (email && password) {
    return {
      success: true,
      user: {
        email,
        name: 'John Doe',
        role: 'admin' // In real app, this comes from server
      }
    };
  }
  
  throw new Error('Invalid credentials');
};

export const register = async (userData: any) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true };
};
