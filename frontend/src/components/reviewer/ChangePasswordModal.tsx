import React, { useState } from 'react';
import { ShieldAlert, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { changePassword } from '../../services/auth.service';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onSuccess }) => {
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (passwords.new.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(passwords.new);
      setIsLoading(false);
      setIsSuccess(true);
      
      // Update local state
      localStorage.setItem('is_temp_password', 'false');

      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error('Change password failed:', err);
      setError(err.message || 'Failed to update password.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className={cn(
        "relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col transition-all duration-500 transform",
        isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
      )}>
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-10" />

        <div className="p-10 space-y-8 relative">
          {!isSuccess ? (
            <>
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10 rotate-3">
                  <ShieldAlert size={40} strokeWidth={2.5} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-black tracking-tight">Security Required</h3>
                  <p className="text-sm text-zinc-500 font-medium">For security reasons, please change your temporary password before accessing the dashboard.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                      <Lock size={12} /> New Password
                    </label>
                    <div className="relative group">
                      <input
                        required
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                      <Lock size={12} /> Confirm New Password
                    </label>
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-600 flex items-center gap-2 animate-shake">
                    <ShieldAlert size={16} />
                    {error}
                  </div>
                )}

                <button
                  disabled={isLoading}
                  type="submit"
                  className="w-full py-5 bg-blue-600 text-white rounded-[1.25rem] font-bold text-xs tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      UPDATING SECURELY...
                    </>
                  ) : (
                    'UPDATE PASSWORD'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6 space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 relative">
                <CheckCircle2 size={56} strokeWidth={2} />
                <div className="absolute -inset-2 bg-emerald-500/10 rounded-full animate-ping pointer-events-none" />
              </div>
              
              <div className="space-y-3">
                <h4 className="text-2xl font-black text-black tracking-tight">Security Updated</h4>
                <p className="text-sm text-zinc-500 font-medium px-4">Your account is now secure. You're being redirected to your dashboard.</p>
              </div>

              <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-[10px] tracking-widest uppercase">
                <Loader2 size={14} className="animate-spin" />
                Finalizing setup...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
