import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import BrandingCard from '../components/BrandingCard';
import RegistrationForm from '../components/RegistrationForm';
import LoginForm from '../components/LoginForm';

const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  // If ?mode=login, flip to login form. Otherwise show registration (default).
  const [isFlipped, setIsFlipped] = useState(searchParams.get('mode') === 'login');
  const [prefilledEmail, setPrefilledEmail] = useState('');

  const handleRegistrationSuccess = (email: string) => {
    localStorage.removeItem('registration_in_progress');
    setPrefilledEmail(email);
    setIsFlipped(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent px-4 sm:px-6 lg:px-8 py-8">
      {/* Unified Card */}
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="flex flex-col md:grid md:grid-cols-2 min-h-[600px] md:min-h-[700px]">

          {/* Branding Panel (Top on mobile, Left on desktop) */}
          <div className="order-1 md:order-1 bg-gradient-to-br from-black to-zinc-900 text-white rounded-t-3xl md:rounded-bl-3xl md:rounded-br-none md:rounded-tl-3xl">
            <BrandingCard />
          </div>

          {/* Form Panel (Bottom on mobile, Right on desktop) */}
          <div className="order-2 md:order-2 bg-white rounded-b-3xl md:rounded-tr-3xl md:rounded-tl-none md:rounded-br-3xl relative">
            {/* 3D Flip Container */}
            <div className="w-full h-full flip-perspective">
              <div
                className={`relative w-full h-full transition-transform duration-700 ease-in-out flip-transform-style ${
                  isFlipped ? 'flip-rotated' : ''
                }`}
              >
                {/* Front: Registration Form */}
                <div className="flip-face w-full h-full bg-white md:rounded-tr-3xl md:rounded-br-3xl">
                  <RegistrationForm
                    onSuccess={handleRegistrationSuccess}
                    onSwitchToLogin={() => setIsFlipped(true)}
                  />
                </div>

                {/* Back: Login Form */}
                <div className="flip-face flip-back w-full h-full bg-white md:rounded-tr-3xl md:rounded-br-3xl">
                  <LoginForm
                    prefilledEmail={prefilledEmail}
                    onSwitchToRegister={() => setIsFlipped(false)}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Flip Animation Styles */}
      <style>{`
        .flip-perspective {
          perspective: 1200px;
        }
        .flip-transform-style {
          transform-style: preserve-3d;
        }
        .flip-face {
          position: absolute;
          top: 0;
          left: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .flip-face:first-child {
          position: relative;
        }
        .flip-back {
          transform: rotateY(180deg);
        }
        .flip-rotated {
          transform: rotateY(180deg);
        }

        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d4d4d8;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1aa;
        }
      `}</style>
    </div>
  );
};

export default Auth;
