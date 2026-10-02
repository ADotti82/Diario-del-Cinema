/**
 * CineDiario - Diario Cinematografico SPA
 * Frontend React + Vite con backend Google Apps Script & TMDB API
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { PWAInstallModal } from './components/PWAInstallModal';
import { SearchAndDiscover } from './components/SearchAndDiscover';
import { MovieEntryModal } from './components/MovieEntryModal';
import { DiaryHistory } from './components/DiaryHistory';
import { DiaryStatsView } from './components/DiaryStatsView';
import { GASSetupModal } from './components/GASSetupModal';
import { TMDBMovie, DiaryEntry, AppSettings } from './types';
import { getStoredSettings, setStoredSettings, getStoredEntries } from './services/storage';
import { fetchDiaryEntriesFromGAS, saveDiaryEntryToGAS, deleteDiaryEntryGAS } from './services/gasService';
import { CheckCircle2, AlertCircle, Film, Sparkles, X } from 'lucide-react';

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

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load diary entries on app startup
  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);
    try {
      const res = await fetchDiaryEntriesFromGAS(settings.gasWebAppUrl);
      setEntries(res.entries);
      if (res.fromGAS) {
        // quiet success or brief indication
      }
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
    try {
      const res = await saveDiaryEntryToGAS(settings.gasWebAppUrl, entry);
      // Immediately reflect in state
      setEntries((prev) => {
        const existingIdx = prev.findIndex((e) => String(e.id) === String(entry.id));
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = entry;
          return updated;
        }
        return [entry, ...prev];
      });

      showToast(res.message, res.success ? 'success' : 'info');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Errore: ${msg}`, 'error');
      return false;
    }
  };

  // Handle deleting entry
  const handleDeleteEntry = async (id: string) => {
    try {
      const res = await deleteDiaryEntryGAS(settings.gasWebAppUrl, id);
      setEntries((prev) => prev.filter((e) => String(e.id) !== String(id)));
      showToast(res.message, 'success');
    } catch (err) {
      showToast('Errore durante l\'eliminazione.', 'error');
    }
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
    // Reload entries from GAS if new URL provided
    if (newSettings.gasWebAppUrl) {
      fetchDiaryEntriesFromGAS(newSettings.gasWebAppUrl).then((r) => {
        setEntries(r.entries);
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navbar with PWA button & Online status */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        diaryCount={entries.length}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenInstallGuide={() => setIsIOSGuideOpen(true)}
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
            isGasConfigured={Boolean(settings.gasWebAppUrl)}
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
          />
        )}
      </main>

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
          className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border animate-bounceIn text-xs sm:text-sm font-semibold max-w-md bg-slate-900/95 border-slate-700 text-white"
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
          {toast.type === 'info' && <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
