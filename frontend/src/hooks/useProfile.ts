import { useState, useEffect, useCallback } from 'react';
import { getProfile, updateProfile as apiUpdateProfile } from '../services/user.service';

export interface UserProfile {
  uid?: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  profileImage: string | null;
  designation?: string;
  bio?: string;
  createdAt?: any;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getProfile();
      if (response.success) {
        setProfile(response.profile);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Fallback to local data if available or default
      const role = localStorage.getItem('role') || 'User';
      const email = localStorage.getItem('userEmail') || '';
      setProfile({
        uid: localStorage.getItem('userId') || '',
        name: localStorage.getItem('userName') || 'Portal User',
        email,
        role,
        phone: '',
        designation: '',
        profileImage: null
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    
    const handleSync = (e: Event) => {
      const customEvt = e as CustomEvent<{ sourceProfile?: UserProfile }>;
      if (customEvt.detail?.sourceProfile) {
        setProfile(customEvt.detail.sourceProfile);
      } else {
        loadProfile();
      }
    };
    window.addEventListener('profile-update', handleSync);
    return () => window.removeEventListener('profile-update', handleSync);
  }, [loadProfile]);

  const updateProfile = async (newData: UserProfile, imageInput?: File | Blob | string | null) => {
    try {
      const formData = new FormData();
      formData.append('name', newData.name || '');
      formData.append('phone', newData.phone || '');
      formData.append('designation', newData.designation || '');
      formData.append('bio', newData.bio || '');
      
      // Determine the image to upload or remove
      const imageToProcess = imageInput !== undefined ? imageInput : newData.profileImage;

      if (imageToProcess instanceof File) {
        formData.append('profileImage', imageToProcess);
      } else if (imageToProcess instanceof Blob) {
        formData.append('profileImage', imageToProcess, 'profile.jpg');
      } else if (typeof imageToProcess === 'string' && imageToProcess.startsWith('data:')) {
        try {
          const res = await fetch(imageToProcess);
          const blob = await res.blob();
          formData.append('profileImage', blob, 'profile.jpg');
        } catch {
          formData.append('profileImage', imageToProcess);
        }
      } else if (imageToProcess === null || imageToProcess === 'null') {
        // Explicitly remove image
        formData.append('profileImage', 'null');
      }

      const response = await apiUpdateProfile(formData);
      
      if (response.success && response.profile) {
        setProfile(response.profile);
        localStorage.setItem('userName', response.profile.name);
        window.dispatchEvent(new CustomEvent('profile-update', { detail: { sourceProfile: response.profile } }));
        return { success: true, profile: response.profile };
      }
      return { success: false, error: response.error || 'Failed to update profile' };
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  return { profile, loading, updateProfile, refreshProfile: loadProfile };
};
