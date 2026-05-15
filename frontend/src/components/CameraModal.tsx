import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Camera, 
  RotateCcw, 
  Check, 
  Monitor,
  AlertCircle,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep stream in a ref so it survives re-renders without causing them
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Attach stream to video element whenever both are available ───────────
  // This useEffect watches for when the video element mounts and the stream
  // is ready, then directly sets srcObject and calls play().
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (!video || !stream || capturedImage) return;

    video.srcObject = stream;

    const playVideo = () => {
      video.play().catch((e) => {
        console.warn('video.play() failed:', e);
      });
    };

    // If already has metadata, play immediately; otherwise wait
    if (video.readyState >= 1) {
      playVideo();
    } else {
      video.addEventListener('loadedmetadata', playVideo, { once: true });
    }

    return () => {
      video.removeEventListener('loadedmetadata', playVideo);
    };
  });

  // ─── Start Camera ─────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    setCapturedImage(null);

    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      // Store in ref — NOT state — to avoid re-renders
      streamRef.current = mediaStream;
      setIsInitializing(false);

      // Manually attach to video element right now if it exists
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setIsInitializing(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access was denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found. Please connect a webcam and try again.');
      } else {
        setError('Could not access camera. Make sure no other app is currently using it.');
      }
    }
  }, []);

  // ─── Stop Camera ──────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // ─── Lifecycle: open/close ────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setError(null);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      stopCamera();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Capture Photo ────────────────────────────────────────────────────────
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use actual video dimensions
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;

    canvas.width = w;
    canvas.height = h;

    // Mirror the capture (selfie-style)
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  // ─── Retake ───────────────────────────────────────────────────────────────
  const handleRetake = () => {
    setCapturedImage(null);
    // Small delay to ensure the video element re-mounts before camera starts
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => startCamera(), 50);
  };

  // ─── Save ─────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  const showLiveFeed = !isInitializing && !error && !capturedImage;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="camera-modal-title"
        className="relative w-full max-w-xl bg-zinc-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300"
      >

        {/* Header */}
        <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400">
              <Camera size={20} />
            </div>
            <div>
              <h3 id="camera-modal-title" className="text-base font-bold text-white tracking-tight">Capture Profile Photo</h3>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                {capturedImage ? 'Preview — looks good?' : 'Live Webcam Preview'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close camera modal"
            className="text-zinc-500 hover:text-white transition-all p-2 hover:bg-white/5 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
          
          {/* Loading */}
          {isInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
              <Loader2 size={32} className="text-blue-500 animate-spin" />
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                Starting Camera...
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center z-10">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500">
                <AlertCircle size={32} />
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">{error}</p>
              <button 
                onClick={startCamera}
                className="px-6 py-2.5 bg-white text-black rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-zinc-200 transition-all active:scale-95"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Captured image preview */}
          {capturedImage && (
            <img 
              src={capturedImage}
              alt="Captured"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Live video — always rendered when live feed expected, 
              hidden otherwise so the ref persists for srcObject assignment */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
              showLiveFeed ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />

          {/* Canvas (hidden) */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Live indicator */}
          {showLiveFeed && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold text-white uppercase tracking-wider">Live</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-8 py-7 bg-black/20">
          <div className="flex items-center justify-center gap-6">
            
            {/* Capture button */}
            {showLiveFeed && (
              <button
                onClick={capturePhoto}
                className="group flex flex-col items-center gap-3 transition-all"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black shadow-xl group-hover:scale-110 group-active:scale-95 transition-all ring-4 ring-white/20">
                  <Camera size={26} />
                </div>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">
                  Capture
                </span>
              </button>
            )}

            {/* Retake + Save */}
            {capturedImage && (
              <>
                <button
                  onClick={handleRetake}
                  className="group flex flex-col items-center gap-3 transition-all"
                >
                  <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-all group-hover:bg-zinc-700">
                    <RotateCcw size={22} />
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-white">
                    Retake
                  </span>
                </button>

                <button
                  onClick={handleSave}
                  className="group flex flex-col items-center gap-3 transition-all"
                >
                  <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-600/30 group-hover:scale-110 group-active:scale-95 transition-all">
                    <Check size={30} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                    Use Photo
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        {!error && !capturedImage && (
          <div className="px-8 py-3 bg-white/[0.03] border-t border-white/5 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-zinc-600">
              <Monitor size={12} />
              <span className="text-[9px] font-bold uppercase tracking-wider">
                {isInitializing ? 'Connecting...' : 'Webcam Active'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600">
              <ImageIcon size={12} />
              <span className="text-[9px] font-bold uppercase tracking-wider">HD Quality</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraModal;
