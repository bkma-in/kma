import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMySubscriptions } from '../services/payment.service';
import { auth } from '../config/firebase';

interface SubscriptionContextType {
  isSubscribed: boolean;
  subscribe: () => void;
  unsubscribe: () => void;
  refreshSubscriptionStatus: () => Promise<void>;
  loading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshSubscriptionStatus = useCallback(async () => {
    try {
      if (!auth.currentUser) {
        setIsSubscribed(false);
        setLoading(false);
        return;
      }
      if (auth.currentUser.email === 'demo788197@gmail.com') {
        const demoStatus = localStorage.getItem('__kma_demo_reader_status');
        if (demoStatus === 'inactive') {
          setIsSubscribed(false);
          setLoading(false);
          return;
        } else if (demoStatus === 'active') {
          setIsSubscribed(true);
          setLoading(false);
          return;
        }
      }
      const data = await getMySubscriptions();
      if (data && data.success) {
        setIsSubscribed(!!data.isSubscribed);
      }
    } catch (err) {
      console.warn('Failed to fetch subscription status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleDemoRoleChange = () => {
      refreshSubscriptionStatus();
    };
    window.addEventListener('kma_demo_role_changed', handleDemoRoleChange);
    return () => window.removeEventListener('kma_demo_role_changed', handleDemoRoleChange);
  }, [refreshSubscriptionStatus]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        refreshSubscriptionStatus();
      } else {
        setIsSubscribed(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [refreshSubscriptionStatus]);

  const subscribe = () => setIsSubscribed(true);
  const unsubscribe = () => setIsSubscribed(false);

  return (
    <SubscriptionContext.Provider value={{ isSubscribed, subscribe, unsubscribe, refreshSubscriptionStatus, loading }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

