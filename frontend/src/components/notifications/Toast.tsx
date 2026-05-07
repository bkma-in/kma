import React from 'react';
import { X, CheckCircle2, AlertCircle, Info as InfoIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  const icons = {
    success: <CheckCircle2 className="text-emerald-400" size={18} />,
    error: <AlertCircle className="text-rose-400" size={18} />,
    info: <InfoIcon className="text-blue-400" size={18} />,
  };

  const borders = {
    success: 'border-emerald-500/20',
    error: 'border-rose-500/20',
    info: 'border-blue-500/20',
  };

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 bg-zinc-900/90 backdrop-blur-md border rounded-2xl shadow-2xl animate-in slide-in-from-right-4 fade-in duration-300",
      borders[type]
    )}>
      <div className="shrink-0">{icons[type]}</div>
      <p className="text-sm font-medium text-white pr-6">{message}</p>
      <button 
        onClick={() => onClose(id)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
