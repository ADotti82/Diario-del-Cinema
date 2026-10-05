import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Code2,
  Rocket,
  X,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Database
} from 'lucide-react';
import { CODE_GS_TEMPLATE, testGASConnection, batchSyncEntriesToGAS, fetchDiaryEntriesFromGAS } from '../services/gasService';
import { DiaryEntry } from '../types';

interface GASAutoConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onSaveUrl: (url: string) => void;
  localEntries: DiaryEntry[];
  onSyncComplete?: (entries: DiaryEntry[]) => void;
  onContinueLocal: () => void;
}

export const GASAutoConnectModal: React.FC<GASAutoConnectModalProps> = ({
  isOpen,
  onClose,
  currentUrl,
  onSaveUrl,
  localEntries,
  onSyncComplete,
  onContinueLocal
}) => {
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(CODE_GS_TEMPLATE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConnectAndSync = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setTestResult({
        success: false,
        message: 'Incolla l\'URL della Web App di Google Apps Script per continuare.'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const check = await testGASConnection(trimmed);
    setTesting(false);
    setTestResult(check);

    if (check.success) {
      onSaveUrl(trimmed);

      // If we have local movies, batch-sync them to the new sheet!
      if (localEntries.length > 0) {
        setSyncing(true);
        try {
          await batchSyncEntriesToGAS(trimmed, localEntries);
        } catch (e) {
          console.warn('Errore sync locale:', e);
        }
        setSyncing(false);
      }

      // Refresh entries from GAS
      try {
        const fres = await fetchDiaryEntriesFromGAS(trimmed);
        if (fres.fromGAS && onSyncComplete) {
          onSyncComplete(fres.entries);
        }
      } catch {
        // quiet
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-amber-500/40 p-6 sm:p-8 shadow-2xl shadow-amber-950/40 my-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <FileSpreadsheet className="w-6 h-6 text-white stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white font-serif tracking-tight">
              Collega Google Sheets <span className="text-amber-400">(Senza Vincoli di Dominio)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Nessun errore di origine OAuth: i film vengono salvati direttamente nel tuo foglio personale su Google Drive.
            </p>
          </div>
        </div>

        {/* 3 Step Interactive Assistant */}
        <div className="space-y-4 text-xs text-slate-300">
          {/* STEP 1 */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              activeStep === 1
                ? 'bg-slate-950 border-amber-500/50 shadow-md'
                : 'bg-slate-950/60 border-slate-800 opacity-90'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center text-xs">
                  1
                </span>
                <h4 className="font-bold text-white text-sm">Crea il Foglio su Google Drive</h4>
              </div>
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setActiveStep(2)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Apri sheets.new</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px] pl-8">
              Apri un nuovo foglio su Google Sheets (puoi chiamarlo <em>&ldquo;CineDiario&rdquo;</em>). Poi nel menu in alto clicca su <strong>Estensioni &rarr; Apps Script</strong>.
            </p>
          </div>

          {/* STEP 2 */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              activeStep === 2
                ? 'bg-slate-950 border-amber-500/50 shadow-md'
                : 'bg-slate-950/60 border-slate-800 opacity-90'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center text-xs">
                  2
                </span>
                <h4 className="font-bold text-white text-sm">Incolla il Codice Script</h4>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleCopyCode();
                  setActiveStep(3);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  copiedCode
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                }`}
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Copiato negli appunti!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copia Codice (1-Clic)</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px] pl-8">
              Nell'editor di Apps Script, cancella il testo preesistente in <code>Code.gs</code> e incolla questo script pronto. Poi premi <strong>Salva</strong> (icona dischetto). Lo script creerà e formatterà la tabella automaticamente!
            </p>
          </div>

          {/* STEP 3 */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              activeStep === 3
                ? 'bg-slate-950 border-amber-500/50 shadow-md'
                : 'bg-slate-950/60 border-slate-800 opacity-90'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center text-xs">
                3
              </span>
              <h4 className="font-bold text-white text-sm">Esegui il Deployment e Incolla l'URL</h4>
            </div>

            <p className="text-slate-400 leading-relaxed text-[11px] pl-8 mb-3">
              In Apps Script in alto a destra clicca su <strong>Esegui il deployment &rarr; Nuovo deployment</strong>.<br />
              - Clicca sull'icona ingranaggio e seleziona <strong>Applicazione web</strong>.<br />
              - Imposta <strong>Chi ha accesso</strong> su: <strong className="text-emerald-400 font-bold">Chiunque</strong> (<em>Anyone</em>).<br />
              - Clicca <strong>Esegui il deployment</strong>, autorizza l'accesso e copia l'URL generato.
            </p>

            {/* URL Input Box */}
            <div className="pl-8 space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />

                <button
                  type="button"
                  onClick={handleConnectAndSync}
                  disabled={testing || syncing || !urlInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap"
                >
                  {testing || syncing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{syncing ? 'Sincronizzazione...' : 'Verifica in corso...'}</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-3.5 h-3.5" />
                      <span>Collega e Sincronizza</span>
                    </>
                  )}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 mt-5 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Nessun account di terze parti: i dati restano nel tuo Google Drive</span>
          </div>

          <button
            type="button"
            onClick={onContinueLocal}
            className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Continua in Locale per ora</span>
          </button>
        </div>
      </div>
    </div>
  );
};
