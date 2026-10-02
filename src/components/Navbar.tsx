import React from 'react';
import { Film, Compass, BarChart3, Settings, Download, WifiOff, Sparkles, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

import { User } from 'firebase/auth';

interface NavbarProps {
  activeTab: 'diary' | 'search' | 'stats' | 'setup';
  setActiveTab: (tab: 'diary' | 'search' | 'stats' | 'setup') => void;
  diaryCount: number;
  onOpenSettings: () => void;
  onOpenInstallGuide: () => void;
  user: User | null;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  diaryCount,
  onOpenSettings,
  onOpenInstallGuide,
  user,
  onOpenAuthModal
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('diary')}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-slate-950 stroke-[2.2]" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-lg text-white font-serif">
                  Cine<span className="text-amber-400">Diario</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  SPA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Diario Cinematografico &bull; Google Sheets
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('diary')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'diary'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Il Mio Diario</span>
              {diaryCount > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'diary'
                      ? 'bg-slate-950 text-amber-400'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {diaryCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'search'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Cerca & Esplora TMDB</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'stats'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistiche</span>
            </button>

            <button
              onClick={() => setActiveTab('setup')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'setup'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Google Sheets / Guida</span>
            </button>
          </nav>

          {/* Right Action buttons: Install PWA + Online status + Settings */}
          <div className="flex items-center gap-2">
            {/* Offline Chip */}
            {!isOnline && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-medium">
                <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                <span className="hidden sm:inline">Offline (Cache attiva)</span>
              </div>
            )}

            {/* PWA Install Button (Always visible on mobile & desktop if not installed) */}
            {!isInstalled && (
              <button
                onClick={() => {
                  if (isInstallable) {
                    install();
                  } else {
                    onOpenInstallGuide();
                  }
                }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow-md shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                title="Installa CineDiario sulla schermata iniziale"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Installa</span>
              </button>
            )}

            {/* Google Profile or Sign-In button */}
            {user ? (
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-xs text-slate-200 transition-colors"
                title={`Collegato con Google: ${user.displayName || user.email}`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Google Avatar"
                    className="w-6 h-6 rounded-full object-cover border border-emerald-400"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                    G
                  </div>
                )}
                <span className="hidden lg:inline text-xs font-medium text-emerald-300 truncate max-w-[90px]">
                  {user.displayName?.split(' ')[0] || 'Google'}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold hover:border-amber-500/50 transition-colors"
                title="Collega Profilo Google (Crea Foglio Automatico)"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.4 7.5 23 12 23z" />
                </svg>
                <span className="hidden sm:inline">Accedi Google</span>
              </button>
            )}

            {/* Quick Settings Gear button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              title="Impostazioni Google Apps Script e TMDB"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar for easy touch accessibility */}
      <div className="md:hidden flex items-center justify-around bg-slate-950/95 backdrop-blur-md border-t border-slate-800/90 py-1.5 px-1 fixed bottom-0 left-0 right-0 z-40 shadow-2xl">
        <button
          onClick={() => setActiveTab('diary')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[11px] ${
            activeTab === 'diary' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Film className="w-5 h-5" />
          <span>Diario ({diaryCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[11px] ${
            activeTab === 'search' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>Cerca</span>
        </button>

        {/* Mobile Install Center Button (if not already installed) */}
        {!isInstalled ? (
          <button
            onClick={() => {
              if (isInstallable) {
                install();
              } else {
                onOpenInstallGuide();
              }
            }}
            className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold text-[11px] active:scale-95 transition-transform"
          >
            <div className="relative">
              <Download className="w-5 h-5 stroke-[2.4]" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </div>
            <span>Installa</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[11px] ${
              activeTab === 'stats' ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Stats</span>
          </button>
        )}

        {!isInstalled && (
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[11px] ${
              activeTab === 'stats' ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Stats</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('setup')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[11px] ${
            activeTab === 'setup' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Backend</span>
        </button>
      </div>
    </header>
  );
};
