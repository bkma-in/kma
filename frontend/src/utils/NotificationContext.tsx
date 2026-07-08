import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import api from '../services/api';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  requiredConfirmationText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface NotificationContextType {
  showToast: (message: string, type?: ToastType) => void;
  confirm: (options: ConfirmOptions) => void;
  toasts: Toast[];
  removeToast: (id: string) => void;
  confirmOptions: ConfirmOptions | null;
  closeConfirm: () => void;
  unreadCount: number;
  clearUnread: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser } = useAuth();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmOptions(options);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmOptions(null);
  }, []);

  const clearUnread = useCallback(() => {
    localStorage.setItem('notifications_cleared_at', Date.now().toString());
    setUnreadCount(0);
    api.post('/notifications/read-all').catch(console.error);
  }, []);

  useEffect(() => {
    // Clean up any existing listeners and timers on user change
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (!currentUser?.uid) {
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      where('read', '==', false)
    );

    const getTimestamp = (val: any) => {
      if (!val) return 0;
      if (typeof val.toMillis === 'function') return val.toMillis();
      if (val.seconds) return val.seconds * 1000;
      if (val._seconds) return val._seconds * 1000;
      return new Date(val).getTime() || 0;
    };

    const processSnapshot = (snapshot: any) => {
      const clearedAt = parseInt(localStorage.getItem('notifications_cleared_at') || '0');
      const count = snapshot.docs.filter((doc: any) => {
        const data = doc.data();
        const time = getTimestamp(data.createdAt);
        return time > clearedAt;
      }).length;
      setUnreadCount(count);
    };

    const startPolling = () => {
      if (pollingRef.current) return;
      
      const poll = async () => {
        try {
          const snapshot = await getDocs(q);
          processSnapshot(snapshot);
        } catch (err) {
          console.error('[NotificationContext] Polling fallback error:', err);
        }
      };

      poll();
      pollingRef.current = setInterval(poll, 2500); // Poll every 2.5 seconds
    };

    try {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        // Stop polling fallback if it was active
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        processSnapshot(snapshot);
      }, (error) => {
        console.warn('[NotificationContext] real-time listener error, falling back to polling:', error);
        startPolling();
      });
      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      console.warn('[NotificationContext] Failed to start real-time listener, falling back to polling:', err);
      startPolling();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [currentUser?.uid]);

  return (
    <NotificationContext.Provider value={{ 
      showToast, 
      confirm, 
      toasts, 
      removeToast, 
      confirmOptions, 
      closeConfirm,
      unreadCount,
      clearUnread
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
