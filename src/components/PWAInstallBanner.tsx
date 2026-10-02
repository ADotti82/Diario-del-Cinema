import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallBannerProps {
  onOpenIOSGuide: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onOpenIOSGuide }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const hasDismissed = sessionStorage.getItem('cinediario_install_dismissed');
    if (hasDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('cinediario_install_dismissed', 'true');
  };

  // Do not show if already installed or dismissed
  if (isInstalled || dismissed) {
    return null;
  }

  // Only show if installable on Chromium/Android or if on iOS Safari
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <aside aria-label="Notifica di installazione applicazione" className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4 mb-2 animate-fadeIn">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-slate-950 p-4 border border-amber-500/30 shadow-xl shadow-amber-950/30 backdrop-blur-md">
        {/* Glow decoration */}
        <div className="absolute -right-12 -top-12 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950">
              <Download className="w-6 h-6 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Installa CineDiario
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200">
                  App PWA
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Aggiungi il diario cinematografico alla tua schermata home per consultare le schede e aggiungere film anche offline!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {isInstallable && (
              <button
                onClick={install}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                Installa Subito
              </button>
            )}

            {isIOS && (
              <button
                onClick={onOpenIOSGuide}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-semibold text-xs sm:text-sm transition-all"
              >
                <Smartphone className="w-4 h-4 text-amber-400" />
                Guida per iPhone / iPad
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Ignora per ora"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
