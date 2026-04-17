import React, { useState, useMemo } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import {
  validateName,
  validateEmail,
  type Role
} from '../utils/validation';

interface RegistrationFormProps {
  onSuccess: (email: string) => void;
  onSwitchToLogin: () => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as Role,
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const passwordsMatch =
    formData.password.length > 0 &&
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  const isFormReady = 
    formData.name.length > 0 && 
    formData.email.length > 0 && 
    formData.password.length === 8 && 
    passwordsMatch;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const nameV = validateName(formData.name);
    if (!nameV.isValid) newErrors.name = nameV.message!;
    const emailV = validateEmail(formData.email);
    if (!emailV.isValid) newErrors.email = emailV.message!;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && isFormReady;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      let msg = "Registration successful! Flipping to login...";
      if (formData.role === 'reviewer') {
        msg = "Your account is under admin approval. You can log in after approval.";
      }
      setSuccessMsg(msg);

      setTimeout(() => {
        onSuccess(formData.email);
      }, 2000);
    }, 1500);
  };

  return (
    <div className="w-full h-full flex flex-col justify-center p-6 sm:p-8 lg:p-12 overflow-y-auto custom-scrollbar bg-white">
      <div className="max-w-md mx-auto w-full py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-1.5 font-['Outfit']">Create Account</h2>
          <p className="text-zinc-500 text-sm">Join the Kerala Mathematical Association</p>
        </header>

        <AnimatePresence mode="wait">
          {successMsg ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 sm:p-8 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col items-center text-center space-y-4"
            >
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-2xl shadow-black/20">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-2">
                <p className="text-black font-bold text-lg">Registration Success</p>
                <p className="text-zinc-600 text-sm leading-relaxed">{successMsg}</p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="form-label" htmlFor="reg-name">Name</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                  <input
                    id="reg-name"
                    type="text"
                    className={cn("input-field pl-11 !border-zinc-200 transition-none", errors.name && "!border-red-500")}
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="form-label" htmlFor="reg-email">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                  <input
                    id="reg-email"
                    type="email"
                    className={cn("input-field pl-11 !border-zinc-200 transition-none", errors.email && "!border-red-500")}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="form-label">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['user', 'author', 'reviewer'] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: r })}
                      className={cn(
                        "py-2.5 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest",
                        formData.role === r
                          ? "bg-black text-white border-black shadow-lg shadow-black/20"
                          : "bg-white text-zinc-400 border-zinc-200 hover:border-black/30"
                      )}
                    >
                      {r === 'user' ? 'User' : r === 'author' ? 'Author' : 'Reviewer'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="form-label" htmlFor="reg-password">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    className="input-field pl-11 pr-11 !border-none !ring-0 !bg-zinc-50"
                    placeholder="Enter your password"
                    maxLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Password Strength Indicator */}
                <div className="flex gap-1.5 mt-2 h-1">
                  {[1, 2, 3, 4].map((i) => {
                    const strength = formData.password.length;
                    let color = "bg-zinc-100";
                    
                    if (strength > 0) {
                      if (i === 1) {
                        if (strength <= 3) color = "bg-red-500";
                        else if (strength <= 5) color = "bg-amber-500";
                        else color = "bg-green-500";
                      } else if (i === 2 && strength >= 4) {
                        if (strength <= 5) color = "bg-amber-500";
                        else color = "bg-green-500";
                      } else if (i === 3 && strength >= 6) {
                        color = "bg-green-500";
                      } else if (i === 4 && strength >= 8) {
                        color = "bg-green-500";
                      }
                    }

                    return (
                      <div 
                        key={i} 
                        className={cn(
                          "flex-1 rounded-full transition-all duration-500",
                          color
                        )} 
                      />
                    );
                  })}
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                  <input
                    id="reg-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    className="input-field pl-11 pr-11 !border-none !ring-0 !bg-zinc-50"
                    placeholder="Enter your password again"
                    maxLength={8}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Underline */}
                <div className={cn(
                  "h-0.5 w-full transition-colors duration-300", 
                  formData.confirmPassword.length === 0 
                    ? "bg-zinc-100" 
                    : formData.password === formData.confirmPassword 
                      ? "bg-green-500" 
                      : "bg-red-500"
                )} />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "btn-primary w-full flex items-center justify-center gap-2 group mt-4",
                  !isFormReady && "opacity-50 cursor-not-allowed grayscale"
                )}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>Register</span>
                    <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              {/* Login Link */}
              <p className="text-center text-zinc-500 text-sm pt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-black font-bold hover:underline"
                >
                  Login
                </button>
              </p>
            </form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RegistrationForm;
