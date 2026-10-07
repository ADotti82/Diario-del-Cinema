import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CineDiario Runtime Error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto mb-4 font-bold text-xl">
              !
            </div>
            <h2 className="text-lg font-bold text-white font-serif mb-2">
              Si è verificato un errore
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              CineDiario ha riscontrato un problema durante il rendering. Puoi ricaricare la pagina o ripristinare i dati locali.
            </p>
            <div className="text-[11px] text-rose-300 font-mono bg-rose-950/40 p-3 rounded-xl border border-rose-900/50 mb-5 break-words text-left overflow-x-auto max-h-32">
              {this.state.error?.message || 'Errore sconosciuto'}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
              >
                Ricarica Pagina
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('cinediario_gas_onboarding_dismissed');
                  } catch {}
                  window.location.reload();
                }}
                className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
              >
                Riavvia App
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// In dev / preview iframe environments, unregister any stale SW to avoid cache interception
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
    });
  } else {
    // Unregister in dev to prevent blank screens or stale module interception
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
