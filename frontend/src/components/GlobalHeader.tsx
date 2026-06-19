import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import logo from '../assets/logo.png';
import ProfileModal from './ProfileModal';
import { useProfile } from '../hooks/useProfile';

interface GlobalHeaderProps {
  onMenuClick: () => void;
  userEmail?: string;
  userName?: string;
  userInitials?: string;
  portalName?: string;
  rightActions?: React.ReactNode;
  showProfile?: boolean;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({ 
  onMenuClick, 
  userName, 
  userInitials, 
  portalName = 'USER PORTAL', 
  rightActions,
  showProfile = true
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { profile, updateProfile } = useProfile();

  useEffect(() => {
    if (!showProfile) {
      setIsProfileOpen(false);
    }
  }, [showProfile]);

  // Use the profile data from hook if available, fallback to props
  const displayName = profile?.name || userName || 'User';
  const displayInitials = profile?.name 
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : userInitials || 'U';

  return (
    <>
      <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 px-6 flex items-center justify-between border-b border-zinc-200 bg-white/80 backdrop-blur-md z-20 shadow-sm overflow-hidden">
        {/* 1. Logo (Left) */}
        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-black hover:text-zinc-600 transition-colors p-2 -ml-2"
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>
          <div className="w-10 h-10 bg-white rounded-lg p-1.5 shadow-sm flex items-center justify-center overflow-hidden border border-zinc-100">
            <img src={logo} alt="BKMA Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* 2. Title (Compact) */}
        <div className="flex-1 px-4 relative z-10 overflow-hidden">
          <h2 className="text-lg lg:text-xl font-bold tracking-tight text-black font-['Outfit'] truncate">
            Bulletin Of Kerala Mathematical Association
          </h2>
        </div>

        {/* 3. Right Actions (Search + Profile) */}
        <div className="flex items-center gap-4 relative z-10 shrink-0">
          <div className="hidden sm:block">
            {rightActions}
          </div>
          
          {/* User Profile - Compact */}
          {showProfile && (
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 transition-all group"
            >
              <div className="hidden md:block text-right">
                <p className="text-[10px] font-bold text-black leading-none">{displayName}</p>
                <p className="text-[7px] text-zinc-400 font-bold tracking-wider mt-0.5 uppercase">
                  {portalName}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-[10px] shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                {profile?.profileImage ? (
                  <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  displayInitials
                )}
              </div>
            </button>
          )}
        </div>
      </header>

      {showProfile && isProfileOpen && (
        <ProfileModal 
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          profile={profile}
          onSave={updateProfile}
        />
      )}
    </>
  );
};

export default GlobalHeader;
