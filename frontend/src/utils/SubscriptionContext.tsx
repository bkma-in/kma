import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserSubscriptions } from '../services/razorpay.service';
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
      const data = await getUserSubscriptions();
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

