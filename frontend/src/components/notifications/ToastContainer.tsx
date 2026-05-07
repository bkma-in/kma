import React from 'react';
import { useNotification } from '../../utils/NotificationContext';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotification();

  return (
    <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 w-full max-w-[320px]">
      {toasts.map((toast) => (
        <Toast 
          key={toast.id} 
          id={toast.id} 
          message={toast.message} 
          type={toast.type} 
          onClose={removeToast} 
        />
      ))}
    </div>
  );
};

export default ToastContainer;
