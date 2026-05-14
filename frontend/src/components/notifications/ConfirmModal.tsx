import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Info } from 'lucide-react';
import { useNotification } from '../../utils/NotificationContext';

const ConfirmModal: React.FC = () => {
  const { confirmOptions, closeConfirm } = useNotification();
  const [inputValue, setInputValue] = useState('');

  // Reset input when modal opens/closes
  useEffect(() => {
    setInputValue('');
  }, [confirmOptions]);

  if (!confirmOptions) return null;

  const { 
    title, 
    message, 
    confirmText = 'Confirm', 
    cancelText = 'Cancel', 
    requiredConfirmationText,
    onConfirm, 
    onCancel 
  } = confirmOptions;

  const handleConfirm = () => {
    if (requiredConfirmationText && inputValue !== requiredConfirmationText) return;
    onConfirm();
    closeConfirm();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    closeConfirm();
  };

  const isConfirmDisabled = requiredConfirmationText 
    ? inputValue.trim().toLowerCase() !== requiredConfirmationText.trim().toLowerCase() 
    : false;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={handleCancel}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
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
        <div className="px-8 py-6 space-y-4">
          <p className="text-zinc-400 text-sm leading-relaxed font-medium">
            {message}
          </p>

          {requiredConfirmationText && (
            <div className="space-y-3 pt-2 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] text-amber-500 font-bold uppercase tracking-widest">
                <Info size={14} />
                Type the text below to confirm
              </div>
              
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center select-none">
                <span className="text-sm font-mono text-white/60 tracking-wider italic">{requiredConfirmationText}</span>
              </div>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type the title here..."
                className="w-full px-5 py-4 bg-zinc-800 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-white/5 flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 py-4 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold text-[10px] tracking-widest transition-all active:scale-95 uppercase"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="flex-1 py-4 px-4 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-xl font-bold text-[10px] tracking-widest transition-all active:scale-95 uppercase disabled:active:scale-100 disabled:cursor-not-allowed shadow-xl shadow-white/5"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
