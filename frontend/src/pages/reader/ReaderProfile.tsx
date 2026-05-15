import { useState } from 'react';
import { 
  User, 
  Shield, 
  Edit3, 
  Camera,
  MapPin,
  Calendar,
  Award
} from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import ProfileModal from '../../components/ProfileModal';
import PhotoActionModal from '../../components/PhotoActionModal';
import { useNotification } from '../../utils/NotificationContext';

const ReaderProfile = () => {
  const { profile, updateProfile } = useProfile();
  const { showToast } = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-700">
      <div className="relative mb-8">
        {/* Cover Pattern / Black Card */}
        <div className="min-h-[280px] w-full bg-black rounded-[2.5rem] relative overflow-hidden shadow-2xl flex flex-col justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
          
          {/* Content inside the black card */}
          <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center md:items-center gap-8 z-20">
            {/* Profile Image (Now inside) */}
            <div className="relative group shrink-0">
              <div className="w-40 h-40 rounded-full bg-white/10 border-4 border-white/20 overflow-hidden shadow-2xl flex items-center justify-center backdrop-blur-sm">
                {profile?.profileImage ? (
                  <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={64} className="text-white/20" />
                )}
              </div>
              <button 
                onClick={() => setIsPhotoModalOpen(true)}
                className="absolute bottom-2 right-2 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-xl hover:bg-zinc-200 transition-all active:scale-90 border-4 border-black z-20"
                title="Change Profile Photo"
              >
                <Camera size={18} />
              </button>
            </div>

            {/* Info Section */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tighter font-['Outfit']">
                  {profile?.name || "Premium Reader"}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md">
                    <Shield size={12} /> {profile?.role || "reader"}
                  </span>
                  <span className="text-zinc-400 text-xs font-medium flex items-center gap-1.5 font-bold">
                    <MapPin size={14} /> Kerala, India
                  </span>
                  <span className="text-zinc-400 text-xs font-medium flex items-center gap-1.5 font-bold">
                    <Calendar size={14} /> Joined Oct 2023
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-8 py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2 mx-auto md:mx-0"
                >
                  <Edit3 size={16} /> Edit Profile Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {/* Contact Info */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 space-y-6 shadow-sm">
            <h2 className="text-lg font-bold text-black flex items-center gap-2 font-['Outfit']">
              <User size={20} className="text-zinc-400" /> Account Information
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Full Name</p>
                <p className="text-black font-medium">{profile?.name || "N/A"}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Email Address</p>
                <p className="text-black font-medium">{profile?.email || "N/A"}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Phone Number</p>
                <p className="text-black font-medium">{profile?.phone || <span className="text-zinc-300 italic">Not provided</span>}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Membership ID</p>
                <p className="text-black font-bold tracking-tight">KMA-MEM-402</p>
              </div>
            </div>
          </div>

          {/* Membership Status */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 space-y-6 shadow-sm">
            <h2 className="text-lg font-bold text-black flex items-center gap-2 font-['Outfit']">
              <Award size={20} className="text-emerald-500" /> Membership Tier
            </h2>
            
            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-emerald-600 font-bold text-lg tracking-tight">Lifetime Access</p>
                <p className="text-xs text-zinc-500 mt-1">Full access to all scholarly publications and archives.</p>
              </div>
              <Shield size={32} className="text-emerald-500/20" />
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center text-black mx-auto border border-zinc-100 shadow-inner">
              <Award size={32} />
            </div>
            <div>
              <h3 className="text-black font-bold">Premium Status</h3>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">You are a verified premium member since October 2023.</p>
            </div>
          </div>
        </div>
      </div>

      <ProfileModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profile={profile}
        onSave={updateProfile}
      />

      <PhotoActionModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        currentImage={profile?.profileImage || null}
        onUpdate={async (newImage) => {
          if (!profile) {
            showToast('Unable to update photo: Profile not loaded', 'error');
            return;
          }
          const result = await updateProfile({ ...profile, profileImage: newImage });
          if (result.success) {
            showToast(newImage ? 'Profile photo updated' : 'Photo removed successfully', 'success');
          } else {
            showToast(result.error || 'Failed to update photo', 'error');
          }
        }}
      />
    </div>
  );
};

export default ReaderProfile;
