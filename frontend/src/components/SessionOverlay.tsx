import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, LogIn, X, Clock, AlertTriangle } from 'lucide-react';

/**
 * SessionOverlay — Renders two things:
 * 1. A top banner when the session is approaching token refresh (~50 min)
 *    telling the user to refresh the page.
 * 2. A full-screen overlay when the session has expired,
 *    telling the user to log in again.
 */
const SessionOverlay: React.FC = () => {
  const { showRefreshNotice, sessionExpired, dismissRefreshNotice, logout } = useAuth();
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoToLogin = async () => {
    try {
      await logout();
    } catch {
      // Ignore errors during logout
    }
    navigate('/auth?mode=login', { replace: true });
  };

  return (
    <>
      {/* ── Refresh Notice Banner ────────────────────────────────── */}
      {showRefreshNotice && !sessionExpired && (
        <div className="fixed top-0 left-0 right-0 z-[9999] animate-slide-down">
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 text-black">
                <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-tight">
                    Session Refresh Recommended
                  </p>
                  <p className="text-xs font-medium opacity-80">
                    Your session has been active for a while. Please refresh the page to keep everything working smoothly.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-zinc-800 transition-all shadow-md"
                >
                  <RefreshCw size={14} />
                  Refresh Now
                </button>
                <button
                  onClick={dismissRefreshNotice}
                  className="p-2 text-black/60 hover:text-black transition-colors rounded-lg hover:bg-black/10"
                  title="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Session Expired Overlay ──────────────────────────────── */}
      {sessionExpired && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-fade-in">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500" size={32} />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-zinc-900 mb-2 font-['Outfit']">
              Session Timed Out
            </h2>

            {/* Message */}
            <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
              Your session has expired due to inactivity or a network interruption. 
              Please log in again to continue where you left off.
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-zinc-100 text-zinc-700 text-sm font-bold rounded-xl hover:bg-zinc-200 transition-all"
              >
                <RefreshCw size={16} />
                Try Refreshing First
              </button>
              <button
                onClick={handleGoToLogin}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-md"
              >
                <LogIn size={16} />
                Go to Login
              </button>
            </div>

            <p className="text-[10px] text-zinc-400 mt-4 uppercase tracking-wider font-bold">
              BKMA Portal • Session Security
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionOverlay;
