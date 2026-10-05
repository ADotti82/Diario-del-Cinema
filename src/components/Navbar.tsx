import { Film, Compass, BarChart3, Settings, Download, WifiOff, Sparkles, Smartphone, FileSpreadsheet } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface NavbarProps {
  activeTab: 'diary' | 'search' | 'stats' | 'setup';
  setActiveTab: (tab: 'diary' | 'search' | 'stats' | 'setup') => void;
  diaryCount: number;
  onOpenSettings: () => void;
  onOpenInstallGuide: () => void;
  isGasConnected: boolean;
  onOpenGASModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  diaryCount,
  onOpenSettings,
  onOpenInstallGuide,
  isGasConnected,
  onOpenGASModal
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

            {/* Google Sheets (GAS) Status or Connect button */}
            {isGasConnected ? (
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-xs text-slate-200 transition-colors cursor-pointer"
                title="Google Sheets collegato tramite Apps Script (Clicca per gestire)"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline text-xs font-semibold text-emerald-300">Foglio Google ✓</span>
              </button>
            ) : (
              <button
                onClick={onOpenGASModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                title="Collega il tuo foglio Google Sheets personale con Google Apps Script"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Collega Foglio Google</span>
                <span className="sm:hidden">Collega Foglio</span>
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
