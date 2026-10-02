import React from 'react';
import { X, Share, PlusSquare, Smartphone, CheckCircle2 } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Installa su iPhone o iPad</h3>
            <p className="text-xs text-slate-400">Aggiungi l'icona alla schermata principale di iOS</p>
          </div>
        </div>

        <div className="space-y-4 my-5 text-sm text-slate-300">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-semibold text-white">Apri il menu Condividi</p>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                Tocca l'icona <Share className="w-4 h-4 text-sky-400 inline" /> nella barra inferiore di Safari.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-semibold text-white">Aggiungi alla schermata Home</p>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                Scorri in basso e tocca <PlusSquare className="w-4 h-4 text-emerald-400 inline" /> <strong>"Aggiungi a Home"</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-semibold text-white">Conferma l'aggiunta</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Premi <strong>"Aggiungi"</strong> in alto a destra. L'icona apparirà sulla home screen come una normale app!
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors"
        >
          Ho capito, grazie
        </button>
      </div>
    </div>
  );
};
