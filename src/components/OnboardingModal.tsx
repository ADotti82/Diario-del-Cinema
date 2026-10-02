import React, { useState } from 'react';
import { Film, Sparkles, HardDrive, CheckCircle2, ShieldCheck, X, ArrowRight, Loader2, Database } from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInWithGoogle: () => Promise<void>;
  onContinueLocal: () => void;
  isCreatingSheet?: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onSignInWithGoogle,
  onContinueLocal,
  isCreatingSheet = false
}) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleClick = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      await onSignInWithGoogle();
      // On success, parent will close or update state
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err?.message || 'Accesso non riuscito. Verifica la connessione e riprova.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-amber-500/30 p-6 sm:p-8 shadow-2xl shadow-amber-950/40 text-center my-6 overflow-hidden">
        {/* Decorative ambient glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/25 mb-4">
          <Film className="w-8 h-8 stroke-[2.2]" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900" />
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-white font-serif tracking-tight">
          Benvenuto in <span className="text-amber-400">CineDiario</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
          Il tuo diario cinematografico personale con metadati TMDB in italiano e salvataggio automatico sul cloud.
        </p>

        {isCreatingSheet ? (
          <div className="my-8 p-6 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <h4 className="text-sm font-bold text-white">Configurazione Google Drive in corso...</h4>
            <p className="text-xs text-slate-400">
              Stiamo creando automaticamente il foglio <strong>&ldquo;CineDiario - Diario Cinematografico&rdquo;</strong> nel tuo Google Drive.
            </p>
          </div>
        ) : (
          <div className="space-y-4 my-6 text-left">
            {/* Option A: Google Sign-In (Recommended) */}
            <div className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-amber-500/40 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Consigliato</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Cloud & Backup Sicuro
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">Hai un profilo Google?</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Entra con il tuo account: verrà creato <strong>in automatico</strong> il foglio di calcolo nel tuo Google Drive dove tutti i film saranno sempre salvati, recuperabili su qualsiasi dispositivo ed esportabili in ogni momento.
                </p>
              </div>

              <div className="pt-2">
                <GoogleSignInButton
                  onClick={handleGoogleClick}
                  isLoading={isLoggingIn}
                  className="w-full"
                  text="Entra con Google e Crea Foglio"
                />
              </div>
            </div>

            {/* Option B: Local Mode */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <HardDrive className="w-4 h-4 text-slate-400" />
                <span>Non hai un account o preferisci salvare in locale?</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Puoi usare l'app subito memorizzando i film sul tuo dispositivo attuale. Potrai comunque collegare Google in un secondo momento senza perdere i film già registrati.
              </p>
              <button
                type="button"
                onClick={onContinueLocal}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Continua con Salvataggio in Locale</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30 text-left">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 mt-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400/80" />
          <span>I tuoi dati sono tuoi: nessun server intermedio o tracking</span>
        </div>
      </div>
    </div>
  );
};
