import React, { useState } from 'react';
import { ExternalLink, Copy, Check, ShieldAlert, X, RefreshCw, HardDrive, Key, Code2, ArrowRight } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface UnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onContinueLocal: () => void;
  onOpenGASSetup?: () => void;
  errorType?: 'origin_mismatch' | 'unauthorized-domain' | null;
}

export const UnauthorizedDomainModal: React.FC<UnauthorizedDomainModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  onContinueLocal,
  onOpenGASSetup,
  errorType = 'origin_mismatch'
}) => {
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [copiedHost, setCopiedHost] = useState(false);
  const [activeTab, setActiveTab] = useState<'oauth' | 'gas'>('oauth');

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  const gcpCredentialsUrl = `https://console.cloud.google.com/apis/credentials?project=${firebaseConfig.projectId}`;
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;

  const handleCopyOrigin = async () => {
    try {
      await navigator.clipboard.writeText(currentOrigin);
      setCopiedOrigin(true);
      setTimeout(() => setCopiedOrigin(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyHost = async () => {
    try {
      await navigator.clipboard.writeText(currentHost);
      setCopiedHost(true);
      setTimeout(() => setCopiedHost(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-amber-500/40 p-6 sm:p-8 shadow-2xl shadow-amber-950/40 my-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
            <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white leading-tight font-serif">
              {errorType === 'origin_mismatch'
                ? 'Errore 400: origin_mismatch (OAuth Google)'
                : 'Autorizzazione Dominio Google Richiesta'}
            </h3>
            <p className="text-xs text-amber-300/90 mt-0.5 font-mono">
              Origine non autorizzata nella Google Cloud Console
            </p>
          </div>
        </div>

        {/* Navigation Tabs between GCP Fix and GAS Alternative */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 mb-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('oauth')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-colors cursor-pointer text-center ${
              activeTab === 'oauth'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Come Risolvere in Google Cloud (1 min)
          </button>
          <button
            onClick={() => setActiveTab('gas')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-colors cursor-pointer text-center ${
              activeTab === 'gas'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Alternativa Google Apps Script (Subito)
          </button>
        </div>

        {activeTab === 'oauth' ? (
          <div className="space-y-4 text-xs text-slate-300">
            <p className="leading-relaxed">
              Google OAuth 2.0 richiede che l'URL di anteprima dell'app sia inserito tra le{' '}
              <strong className="text-white">Origini JavaScript autorizzate</strong> del tuo ID Client OAuth:
            </p>

            {/* 1-Click Copy Box for Origin */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Origine JavaScript da incollare:
                </span>
                <code className="text-xs text-amber-400 font-mono truncate block select-all font-bold">
                  {currentOrigin}
                </code>
              </div>

              <button
                onClick={handleCopyOrigin}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex-shrink-0 cursor-pointer"
              >
                {copiedOrigin ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                    <span className="text-emerald-400">Copiato!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copia URL</span>
                  </>
                )}
              </button>
            </div>

            {/* 3 Steps Guide */}
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  1
                </span>
                <div className="flex-1">
                  <span className="font-semibold text-white">Apri le Credenziali Google Cloud</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Clicca sul pulsante qui sotto per andare alle <em>Credenziali</em> del progetto <code>{firebaseConfig.projectId}</code> e clicca sul tuo <strong>ID client OAuth 2.0 Web</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  2
                </span>
                <div className="flex-1">
                  <span className="font-semibold text-white">Aggiungi l'Origine JavaScript</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Sotto <strong>Origini JavaScript autorizzate</strong> (<em>Authorized JavaScript origins</em>), clicca su <strong>+ AGGIUNGI URI</strong> e incolla <code>{currentOrigin}</code>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  3
                </span>
                <div className="flex-1">
                  <span className="font-semibold text-white">Salva e Riprova l'accesso</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Clicca sul tasto blu <strong>SALVA</strong> in fondo alla pagina Google Cloud, quindi torna qui e premi <strong>Riprova Accesso</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Link to Google Cloud Console */}
            <div className="pt-2 space-y-2">
              <a
                href={gcpCredentialsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Apri Google Cloud Console &rarr; Credenziali OAuth</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <p className="text-[11px] text-slate-400 text-center">
                (Se utilizzi anche Firebase Auth, puoi verificare anche i{' '}
                <a
                  href={firebaseSettingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline"
                >
                  Domini autorizzati in Firebase
                </a>
                )
              </p>
            </div>
          </div>
        ) : (
          /* GAS Alternative tab */
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
              <h4 className="font-bold flex items-center gap-1.5 text-white">
                <Code2 className="w-4 h-4 text-amber-400" />
                Google Apps Script (GAS): Zero restrizioni di dominio!
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Se non desideri configurare origini OAuth nella Google Cloud Console, puoi utilizzare il backend Google Apps Script integrato in CineDiario. Funziona con qualsiasi dominio di preview e salva direttamente nel tuo foglio Google Sheets!
              </p>
            </div>

            <div className="space-y-2 text-slate-300">
              <p>Come funziona:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                <li>Apri le Impostazioni di CineDiario (icona ingranaggio).</li>
                <li>Copia il codice <code>Code.gs</code> predisposto a un clic.</li>
                <li>Incollalo nel tuo foglio Google Sheets in <em>Estensioni &rarr; Apps Script</em>.</li>
                <li>Esegui il deploy come applicazione web e incolla l'URL in CineDiario.</li>
              </ol>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenGASSetup) onOpenGASSetup();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>Apri Configurazione Google Apps Script</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onRetry}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Riprova Accesso</span>
          </button>

          <button
            type="button"
            onClick={onContinueLocal}
            className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium border border-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Continua in Locale</span>
          </button>
        </div>
      </div>
    </div>
  );
};
