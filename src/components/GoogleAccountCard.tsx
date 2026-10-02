import React from 'react';
import { User } from 'firebase/auth';
import { ExternalLink, RefreshCw, LogOut, CheckCircle2, FileSpreadsheet, HardDrive, Sparkles } from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';

interface GoogleAccountCardProps {
  user: User | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  isSyncing: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onSync: () => void;
  entriesCount: number;
}

export const GoogleAccountCard: React.FC<GoogleAccountCardProps> = ({
  user,
  spreadsheetId,
  spreadsheetUrl,
  isSyncing,
  onSignIn,
  onSignOut,
  onSync,
  entriesCount
}) => {
  if (!user) {
    return (
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/30 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <HardDrive className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">Modalità di Salvataggio: Locale</h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {entriesCount} film sul dispositivo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                I tuoi film sono salvati nella memoria del browser. Collega Google per salvarli per sempre nel tuo Google Drive.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-1">
          <GoogleSignInButton
            onClick={onSignIn}
            text="Collega Profilo Google (Crea Foglio Automatico)"
            className="w-full sm:w-auto"
          />
        </div>
      </div>
    );
  }

  const effectiveUrl = spreadsheetUrl || (spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : null);

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/40 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* User Profile */}
        <div className="flex items-center gap-3.5">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Google User'}
              className="w-11 h-11 rounded-full border-2 border-emerald-400 object-cover"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-bold text-base">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'G'}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">{user.displayName || 'Utente Google'}</h4>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Collegato
              </span>
            </div>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        {/* Sync & Disconnect */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
            title="Sincronizza film dal foglio Google"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            <span>Sincronizza</span>
          </button>

          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 text-xs font-medium transition-colors"
            title="Esci dal profilo Google"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Esci</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Info */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-white">Foglio Google Sheets: CineDiario - Diario Cinematografico</p>
            <p className="text-[11px] text-slate-400">
              Tutti i tuoi dati sono salvati automaticamente sul tuo Google Drive personale.
            </p>
          </div>
        </div>

        {effectiveUrl && (
          <a
            href={effectiveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold text-xs transition-colors whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <span>Apri in Google Sheets</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};
