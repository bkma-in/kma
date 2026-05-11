import { useState, useEffect, useCallback } from 'react';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  phone: string;
  profileImage: string | null;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const loadProfile = useCallback(() => {
    const role = localStorage.getItem('role') || 'User';
    const email = localStorage.getItem('userEmail') || '';
    
    // Try to get stored profile data
    const storedProfile = localStorage.getItem(`profile_${email}`);
    
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    } else {
      // Default profile based on role/localStorage
      const defaultProfile: UserProfile = {
        name: localStorage.getItem('userName') || (role === 'admin' ? 'Admin Manager' : 'Portal User'),
        email: email,
        role: role.charAt(0).toUpperCase() + role.slice(1),
        phone: '',
        profileImage: null
      };
      setProfile(defaultProfile);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    
    // Listen for storage changes to sync across tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('profile_')) {
        loadProfile();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadProfile]);

  const updateProfile = async (newData: UserProfile) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      localStorage.setItem(`profile_${newData.email}`, JSON.stringify(newData));
      setProfile(newData);
      
      // Manually trigger storage event for current tab
      window.dispatchEvent(new StorageEvent('storage', { key: `profile_${newData.email}` }));
      
      return { success: true };
    } catch (error: any) {
      if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.error('Storage quota exceeded');
        return { success: false, error: 'Image is too large for local storage. Please use a smaller file (< 3MB).' };
      }
      console.error('Failed to update profile:', error);
      return { success: false };
    }
  };

  return { profile, updateProfile, refreshProfile: loadProfile };
};
