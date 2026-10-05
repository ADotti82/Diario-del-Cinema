/**
 * CineDiario - Diario Cinematografico SPA
 * Connessione Google Workspace con Google Apps Script (GAS) & TMDB API
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { PWAInstallModal } from './components/PWAInstallModal';
import { GASAutoConnectModal } from './components/GASAutoConnectModal';
import { SearchAndDiscover } from './components/SearchAndDiscover';
import { MovieEntryModal } from './components/MovieEntryModal';
import { DiaryHistory } from './components/DiaryHistory';
import { DiaryStatsView } from './components/DiaryStatsView';
import { GASSetupModal } from './components/GASSetupModal';
import { TMDBMovie, DiaryEntry, AppSettings } from './types';
import { getStoredSettings, setStoredSettings, getStoredEntries, setStoredEntries } from './services/storage';
import { fetchDiaryEntriesFromGAS, saveDiaryEntryToGAS, deleteDiaryEntryGAS } from './services/gasService';
import { CheckCircle2, AlertCircle, Film, Sparkles, X, FileSpreadsheet } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'diary' | 'search' | 'stats' | 'setup'>('diary');
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);
  const [entries, setEntries] = useState<DiaryEntry[]>(getStoredEntries);
  const [loadingEntries, setLoadingEntries] = useState<boolean>(false);

  // Modals state
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isIOSGuideOpen, setIsIOSGuideOpen] = useState(false);
  const [isGASAutoConnectOpen, setIsGASAutoConnectOpen] = useState<boolean>(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; actionUrl?: string; actionLabel?: string } | null>(null);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
    actionUrl?: string,
    actionLabel?: string
  ) => {
    setToast({ message, type, actionUrl, actionLabel });
    setTimeout(() => {
      setToast((cur) => (cur?.message === message ? null : cur));
    }, 5000);
  };

  // Check GAS connection assistant on initial mount
  useEffect(() => {
    const gasDismissed = localStorage.getItem('cinediario_gas_onboarding_dismissed');
    if (!settings.gasWebAppUrl && gasDismissed !== 'true') {
      setIsGASAutoConnectOpen(true);
    }
  }, [settings.gasWebAppUrl]);

  // Load diary entries (from GAS if configured, else from local storage)
  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);
    try {
      if (settings.gasWebAppUrl && settings.gasWebAppUrl.trim().length > 0) {
        const res = await fetchDiaryEntriesFromGAS(settings.gasWebAppUrl);
        setEntries(res.entries);
        setLoadingEntries(false);
        return;
      }

      // Local storage fallback
      const local = getStoredEntries();
      setEntries(local);
    } catch (e) {
      console.error('Error loading diary entries:', e);
    } finally {
      setLoadingEntries(false);
    }
  }, [settings.gasWebAppUrl]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Handle saving movie entry (both new and edited)
  const handleSaveEntry = async (entry: DiaryEntry): Promise<boolean> => {
    // 1. Optimistic UI update in state & localStorage
    const currentEntries = getStoredEntries();
    const existingIdx = currentEntries.findIndex((e) => String(e.id) === String(entry.id));
    let updatedEntries: DiaryEntry[];

    if (existingIdx >= 0) {
      updatedEntries = [...currentEntries];
      updatedEntries[existingIdx] = entry;
    } else {
      updatedEntries = [entry, ...currentEntries];
    }
    setStoredEntries(updatedEntries);
    setEntries(updatedEntries);

    // 2. Save via Google Apps Script Web App if configured
    if (settings.gasWebAppUrl && settings.gasWebAppUrl.trim().length > 0) {
      try {
        const res = await saveDiaryEntryToGAS(settings.gasWebAppUrl, entry);
        showToast(
          res.success
            ? 'Film registrato nel tuo foglio Google Sheets!'
            : 'Film salvato nella memoria locale.',
          res.success ? 'success' : 'info'
        );
        return true;
      } catch (gasErr: any) {
        showToast('Film salvato nella memoria locale (in attesa di sincronizzazione con il foglio).', 'info');
        return true;
      }
    }

    // 3. Local mode confirmed
    showToast('Film salvato nella memoria locale del dispositivo.', 'success');
    return true;
  };

  // Handle deleting entry
  const handleDeleteEntry = async (id: string) => {
    // Immediate state & local storage removal
    const updated = entries.filter((e) => String(e.id) !== String(id));
    setEntries(updated);
    setStoredEntries(updated);

    // If GAS configured, delete from sheet
    if (settings.gasWebAppUrl && settings.gasWebAppUrl.trim().length > 0) {
      try {
        await deleteDiaryEntryGAS(settings.gasWebAppUrl, id);
        showToast('Film rimosso dal foglio Google.', 'success');
        return;
      } catch {
        // silent fallback
      }
    }

    showToast('Film rimosso dal diario.', 'success');
  };

  // Movie selected from Search or Discover
  const handleSelectMovieForEntry = (movie: TMDBMovie) => {
    const existing = entries.find((e) => String(e.id) === String(movie.id));
    setSelectedMovie(movie);
    setEditingEntry(existing || null);
    setIsEntryModalOpen(true);
  };

  // Movie selected from History for editing
  const handleEditEntryFromHistory = (entry: DiaryEntry) => {
    const movieObj: TMDBMovie = {
      id: Number(entry.id) || Date.now(),
      title: entry.title,
      original_title: entry.original_title,
      poster_path: entry.poster_path,
      release_date: entry.release_year ? `${entry.release_year}-01-01` : undefined,
      overview: entry.overview
    };
    setSelectedMovie(movieObj);
    setEditingEntry(entry);
    setIsEntryModalOpen(true);
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    setStoredSettings(newSettings);
    showToast('Impostazioni aggiornate!', 'success');
    if (newSettings.gasWebAppUrl) {
      fetchDiaryEntriesFromGAS(newSettings.gasWebAppUrl).then((r) => {
        setEntries(r.entries);
      });
    }
  };

  const isGasConnected = Boolean(settings.gasWebAppUrl && settings.gasWebAppUrl.trim().length > 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navbar with Google Apps Script Status & PWA install */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        diaryCount={entries.length}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenInstallGuide={() => setIsIOSGuideOpen(true)}
        isGasConnected={isGasConnected}
        onOpenGASModal={() => setIsGASAutoConnectOpen(true)}
      />

      {/* In-App PWA Install Invitation Banner */}
      <PWAInstallBanner onOpenIOSGuide={() => setIsIOSGuideOpen(true)} />

      {/* Main Content View Switcher */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'diary' && (
          <DiaryHistory
            entries={entries}
            loading={loadingEntries}
            onRefresh={loadEntries}
            onEditEntry={handleEditEntryFromHistory}
            onDeleteEntry={handleDeleteEntry}
            onGoToSearch={() => setActiveTab('search')}
            isGasConfigured={isGasConnected}
          />
        )}

        {activeTab === 'search' && (
          <SearchAndDiscover
            apiKey={settings.tmdbApiKey}
            diaryEntries={entries}
            onSelectMovie={handleSelectMovieForEntry}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />
        )}

        {activeTab === 'stats' && (
          <DiaryStatsView
            entries={entries}
            onGoToSearch={() => setActiveTab('search')}
          />
        )}

        {activeTab === 'setup' && (
          <GASSetupModal
            settings={settings}
            onSaveSettings={handleUpdateSettings}
            isStandaloneTab={true}
            entriesCount={entries.length}
          />
        )}
      </main>

      {/* Modal: Assistente Connessione Google Apps Script (Zero Restrizioni di Dominio) */}
      <GASAutoConnectModal
        isOpen={isGASAutoConnectOpen}
        onClose={() => setIsGASAutoConnectOpen(false)}
        currentUrl={settings.gasWebAppUrl}
        onSaveUrl={(newUrl) => {
          handleUpdateSettings({ ...settings, gasWebAppUrl: newUrl });
          showToast('Foglio Google collegato con successo!', 'success');
        }}
        localEntries={entries}
        onSyncComplete={(newEntries) => {
          setEntries(newEntries);
          showToast(`Sincronizzazione completata: ${newEntries.length} film nel diario!`, 'success');
        }}
        onContinueLocal={() => {
          localStorage.setItem('cinediario_gas_onboarding_dismissed', 'true');
          setIsGASAutoConnectOpen(false);
          showToast('Modalità locale attiva. Puoi collegare Google Sheets in qualsiasi momento!', 'info');
        }}
      />

      {/* Modal: Inserimento / Modifica Dati Film (Tutti i campi opzionali) */}
      <MovieEntryModal
        movie={selectedMovie}
        existingEntry={editingEntry}
        isOpen={isEntryModalOpen}
        onClose={() => {
          setIsEntryModalOpen(false);
          setSelectedMovie(null);
          setEditingEntry(null);
        }}
        onSave={handleSaveEntry}
      />

      {/* Modal: Impostazioni Rapide GAS & TMDB */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-2xl my-6">
            <GASSetupModal
              settings={settings}
              onSaveSettings={handleUpdateSettings}
              onClose={() => setIsSettingsModalOpen(false)}
              entriesCount={entries.length}
            />
          </div>
        </div>
      )}

      {/* Modal: Guida Installazione PWA per iOS Safari */}
      <PWAInstallModal
        isOpen={isIOSGuideOpen}
        onClose={() => setIsIOSGuideOpen(false)}
      />

      {/* Global Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border animate-bounceIn text-xs sm:text-sm font-semibold max-w-md bg-slate-900/95 border-slate-700 text-white"
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
          {toast.type === 'info' && <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />}
          
          <div className="flex-1">
            <span>{toast.message}</span>
            {toast.actionUrl && (
              <a
                href={toast.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-1 text-emerald-400 hover:text-emerald-300 underline font-bold text-xs"
              >
                {toast.actionLabel || 'Visualizza'} &rarr;
              </a>
            )}
          </div>

          <button
            onClick={() => setToast(null)}
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
