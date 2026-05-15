import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  Upload,
  User
} from 'lucide-react';
import { cn } from '../utils/cn';
import CameraModal from './CameraModal';

interface PhotoActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage: string | null;
  onUpdate: (newImage: string | null) => void;
}

const PhotoActionModal: React.FC<PhotoActionModalProps> = ({ isOpen, onClose, currentImage, onUpdate }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate(reader.result as string);
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    onUpdate(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <h3 className="text-sm font-bold text-white tracking-tight uppercase tracking-widest">Profile Photo</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          {/* Current Image Preview */}
          <div className="w-24 h-24 rounded-full bg-zinc-800 border-4 border-zinc-900 overflow-hidden shadow-xl mb-8 flex items-center justify-center">
            {currentImage ? (
              <img src={currentImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-zinc-600" />
            )}
          </div>

          {/* Action List */}
          <div className="w-full space-y-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <Upload size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Upload from Device</p>
                <p className="text-[10px] text-zinc-500 font-medium">Select a local image file</p>
              </div>
            </button>

            <button 
              onClick={() => setIsCameraOpen(true)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                <Camera size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Use Camera</p>
                <p className="text-[10px] text-zinc-500 font-medium">Capture a live photo</p>
              </div>
            </button>

            {currentImage && (
              <button 
                onClick={handleRemove}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-500 transition-all group border border-rose-500/10"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                  <Trash2 size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Remove Photo</p>
                  <p className="text-[10px] text-rose-500/50 font-medium">Reset to default avatar</p>
                </div>
              </button>
            )}
          </div>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={(img) => {
          onUpdate(img);
          onClose();
        }}
      />
    </div>
  );
};

export default PhotoActionModal;
