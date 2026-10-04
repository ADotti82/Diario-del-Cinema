import React, { useState } from 'react';
import { ExternalLink, Copy, Check, ShieldAlert, X, RefreshCw, HardDrive } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface UnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onContinueLocal: () => void;
}

export const UnauthorizedDomainModal: React.FC<UnauthorizedDomainModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  onContinueLocal
}) => {
  const [copied, setCopied] = useState(false);
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-amber-500/40 p-6 sm:p-7 shadow-2xl shadow-amber-950/40 my-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
            <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
              Autorizzazione Dominio Firebase Richiesta
            </h3>
            <p className="text-xs text-amber-300/90 mt-0.5">
              Codice errore: <code>auth/unauthorized-domain</code>
            </p>
          </div>
        </div>

        {/* Explanation */}
        <p className="text-xs text-slate-300 leading-relaxed">
          Per motivi di sicurezza di Google Firebase, il dominio dell'app deve essere aggiunto all'elenco dei <strong>Domini autorizzati</strong> del tuo progetto Google Cloud/Firebase:
        </p>

        {/* Current Domain Box with 1-Click Copy */}
        <div className="my-4 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Dominio da autorizzare:
            </span>
            <code className="text-xs text-amber-400 font-mono truncate block select-all">
              {currentDomain}
            </code>
          </div>

          <button
            onClick={handleCopy}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex-shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                <span className="text-emerald-400">Copiato!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copia</span>
              </>
            )}
          </button>
        </div>

        {/* 3 Step Instructions */}
        <div className="space-y-2.5 my-4 text-xs text-slate-300">
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
              1
            </span>
            <div className="flex-1">
              <span className="font-semibold text-white">Apri la Console Firebase</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Clicca sul pulsante qui sotto per andare direttamente alla scheda <em>Settings</em> di Authentication nel tuo progetto <code>{firebaseConfig.projectId}</code>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
              2
            </span>
            <div className="flex-1">
              <span className="font-semibold text-white">Aggiungi il Dominio</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Scorri fino alla sezione <strong>Domini autorizzati</strong> (<em>Authorized domains</em>), clicca su <strong>Aggiungi dominio</strong> e incolla il dominio copiato sopra.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
              3
            </span>
            <div className="flex-1">
              <span className="font-semibold text-white">Salva e Riprova l'accesso</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Premi <strong>Aggiungi</strong> su Firebase e poi clicca <strong>&ldquo;Riprova Accesso&rdquo;</strong> qui sotto!
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action: Direct Link to Firebase Settings */}
        <div className="space-y-2 pt-2">
          <a
            href={firebaseSettingsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Apri Console Firebase &rarr; Impostazioni</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onRetry}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Riprova Accesso</span>
            </button>

            <button
              type="button"
              onClick={onContinueLocal}
              className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium border border-slate-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Continua in Locale</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
