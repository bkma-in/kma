import { X, AlertCircle } from 'lucide-react';
import { useNotification } from '../../utils/NotificationContext';

const ConfirmModal: React.FC = () => {
  const { confirmOptions, closeConfirm } = useNotification();

  if (!confirmOptions) return null;

  const { title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel } = confirmOptions;

  const handleConfirm = () => {
    onConfirm();
    closeConfirm();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    closeConfirm();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={handleCancel}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400">
              <AlertCircle size={18} />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          </div>
          <button 
            onClick={handleCancel}
            className="text-zinc-500 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <p className="text-zinc-400 text-sm leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-white/5 flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold text-xs tracking-widest transition-all active:scale-95"
          >
            {cancelText.toUpperCase()}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-xs tracking-widest transition-all active:scale-95"
          >
            {confirmText.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
