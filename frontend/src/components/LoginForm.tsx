import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';

interface LoginFormProps {
  prefilledEmail?: string;
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ prefilledEmail = '', onSwitchToRegister }) => {
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [prefilledEmail]);

  return (
    <div className="w-full h-full flex flex-col justify-center p-6 sm:p-8 lg:p-12 bg-white">
      <div className="max-w-md mx-auto w-full">
        {/* Header */}
        <header className="mb-8 sm:mb-10 text-center md:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-1.5 font-['Outfit']">Welcome Back</h2>
          <p className="text-zinc-500 text-sm">Log in to your KMA account</p>
        </header>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="form-label" htmlFor="login-email">Email</label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
              <input
                id="login-email"
                type="email"
                className="input-field pl-11 !border-zinc-200"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="form-label mb-0" htmlFor="login-password">Password</label>
              <button type="button" className="text-[10px] font-bold text-zinc-400 hover:text-black uppercase tracking-wider transition-colors">
                Forgot?
              </button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="input-field pl-11 pr-11 !border-none !bg-zinc-50"
                placeholder="Enter your password"
                maxLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                const strength = password.length;
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

          {/* Development Notice */}
          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex gap-3 text-amber-600 items-start">
            <AlertTriangle className="shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider">Authentication Notice</p>
              <p className="text-[12px] leading-snug text-zinc-600">
                Login functionality is not active now. Please contact admin for details.
              </p>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="button"
            disabled={true}
            className="btn-primary w-full flex items-center justify-center gap-2 opacity-50 cursor-not-allowed grayscale"
          >
            <LogIn size={18} />
            Login
          </button>

          {/* Register Link */}
          <p className="text-center text-zinc-500 text-sm pt-2">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-black font-bold hover:underline"
            >
              Register
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
