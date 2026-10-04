/**
 * CineDiario - Diario Cinematografico SPA
 * Connessione Google Workspace (Google Drive & Google Sheets), backend GAS e TMDB API
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { PWAInstallModal } from './components/PWAInstallModal';
import { OnboardingModal } from './components/OnboardingModal';
import { SearchAndDiscover } from './components/SearchAndDiscover';
import { MovieEntryModal } from './components/MovieEntryModal';
import { DiaryHistory } from './components/DiaryHistory';
import { DiaryStatsView } from './components/DiaryStatsView';
import { GASSetupModal } from './components/GASSetupModal';
import { TMDBMovie, DiaryEntry, AppSettings } from './types';
import { getStoredSettings, setStoredSettings, getStoredEntries, setStoredEntries } from './services/storage';
import { fetchDiaryEntriesFromGAS, saveDiaryEntryToGAS, deleteDiaryEntryGAS } from './services/gasService';
import { initAuth, googleSignIn, googleSignOut, getAccessToken, AppGoogleUser } from './services/googleAuth';
import { UnauthorizedDomainModal } from './components/UnauthorizedDomainModal';
import {
  findOrCreateGoogleSpreadsheet,
  fetchEntriesFromGoogleSheet,
  appendEntryToGoogleSheet,
  batchAppendEntriesToGoogleSheet,
  deleteEntryFromGoogleSheet,
  getStoredSpreadsheetId,
  setStoredSpreadsheetId
} from './services/googleSheetsService';
import { CheckCircle2, AlertCircle, Film, Sparkles, X, FileSpreadsheet } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'diary' | 'search' | 'stats' | 'setup'>('diary');
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);
  const [entries, setEntries] = useState<DiaryEntry[]>(getStoredEntries);
  const [loadingEntries, setLoadingEntries] = useState<boolean>(false);

  // Google Authentication & Google Sheets State
  const [googleUser, setGoogleUser] = useState<AppGoogleUser | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(getStoredSpreadsheetId);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => {
    const id = getStoredSpreadsheetId();
    return id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : null;
  });
  const [isCreatingSheet, setIsCreatingSheet] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals state
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isIOSGuideOpen, setIsIOSGuideOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isUnauthorizedDomainOpen, setIsUnauthorizedDomainOpen] = useState<boolean>(false);
  const [oauthErrorType, setOauthErrorType] = useState<'origin_mismatch' | 'unauthorized-domain' | null>('origin_mismatch');

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

  // Check onboarding on initial mount
  useEffect(() => {
    const onboardingDecided = localStorage.getItem('cinediario_onboarding_decided');
    if (onboardingDecided !== 'true') {
      setIsOnboardingOpen(true);
    }
  }, []);

  // Initialize Firebase Auth Listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
      },
      () => {
        // User logged out or token cleared
        setGoogleAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Load diary entries (from Google Sheet if connected, else from GAS, else from local)
  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);
    try {
      // 1. If Google connected with token and spreadsheet ID:
      if (googleAccessToken && spreadsheetId) {
        try {
          const sheetEntries = await fetchEntriesFromGoogleSheet(spreadsheetId, googleAccessToken);
          if (sheetEntries.length > 0 || entries.length === 0) {
            setEntries(sheetEntries);
            setStoredEntries(sheetEntries);
          }
          setLoadingEntries(false);
          return;
        } catch (sheetErr) {
          console.warn('Lettura da Google Sheets non riuscita, fallback su cache locale:', sheetErr);
        }
      }

      // 2. If GAS Web App URL configured:
      if (settings.gasWebAppUrl) {
        const res = await fetchDiaryEntriesFromGAS(settings.gasWebAppUrl);
        setEntries(res.entries);
        setLoadingEntries(false);
        return;
      }

      // 3. Fallback to local storage
      const local = getStoredEntries();
      setEntries(local);
    } catch (e) {
      console.error('Error loading diary entries:', e);
    } finally {
      setLoadingEntries(false);
    }
  }, [googleAccessToken, spreadsheetId, settings.gasWebAppUrl, entries.length]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Google Sign-In & Automatic Spreadsheet Creation Flow
  const handleGoogleSignIn = async () => {
    setIsCreatingSheet(true);
    try {
      const authResult = await googleSignIn();
      if (!authResult) {
        setIsCreatingSheet(false);
        return;
      }

      setGoogleUser(authResult.user);
      setGoogleAccessToken(authResult.accessToken);

      // Automatically find or create the Google Spreadsheet
      const sheetInfo = await findOrCreateGoogleSpreadsheet(authResult.accessToken);
      setSpreadsheetId(sheetInfo.spreadsheetId);
      setSpreadsheetUrl(sheetInfo.webViewLink);
      setStoredSpreadsheetId(sheetInfo.spreadsheetId);

      // If this is a newly created spreadsheet and we have existing local entries, batch sync them!
      const currentLocal = getStoredEntries();
      if (sheetInfo.isNew && currentLocal.length > 0) {
        try {
          await batchAppendEntriesToGoogleSheet(sheetInfo.spreadsheetId, authResult.accessToken, currentLocal);
        } catch (migErr) {
          console.warn('Errore sincronizzazione iniziale:', migErr);
        }
      }

      // Read entries from the spreadsheet
      const synced = await fetchEntriesFromGoogleSheet(sheetInfo.spreadsheetId, authResult.accessToken);
      if (synced.length > 0) {
        setEntries(synced);
        setStoredEntries(synced);
      }

      localStorage.setItem('cinediario_onboarding_decided', 'true');
      setIsOnboardingOpen(false);

      showToast(
        sheetInfo.isNew
          ? 'Foglio "CineDiario" creato con successo su Google Drive!'
          : 'Connesso al tuo foglio Google Sheets su Google Drive!',
        'success',
        sheetInfo.webViewLink,
        'Apri Foglio'
      );
    } catch (err: any) {
      console.error('Google sign-in / sheet creation error:', err);
      if (
        err?.code === 'origin_mismatch' ||
        err?.message?.includes('origin_mismatch')
      ) {
        setOauthErrorType('origin_mismatch');
        setIsOnboardingOpen(false);
        setIsSettingsModalOpen(false);
        setIsUnauthorizedDomainOpen(true);
        return;
      }
      if (
        err?.code === 'auth/unauthorized-domain' ||
        err?.message?.includes('unauthorized-domain')
      ) {
        setOauthErrorType('unauthorized-domain');
        setIsOnboardingOpen(false);
        setIsSettingsModalOpen(false);
        setIsUnauthorizedDomainOpen(true);
        return;
      }
      showToast(err?.message || 'Errore durante la connessione con Google', 'error');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Google Sign Out
  const handleGoogleSignOut = async () => {
    await googleSignOut();
    setGoogleUser(null);
    setGoogleAccessToken(null);
    showToast('Disconnesso dal profilo Google.', 'info');
  };

  // Manual Sync from Google Sheets
  const handleManualSync = async () => {
    if (!googleAccessToken || !spreadsheetId) {
      showToast('Collega prima il tuo profilo Google per sincronizzare.', 'info');
      return;
    }
    setIsSyncing(true);
    try {
      const sheetEntries = await fetchEntriesFromGoogleSheet(spreadsheetId, googleAccessToken);
      setEntries(sheetEntries);
      setStoredEntries(sheetEntries);
      showToast(`Sincronizzazione completata: ${sheetEntries.length} film recuperati dal foglio Google.`, 'success');
    } catch (err: any) {
      showToast(`Errore di sincronizzazione: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Continue Local Choice
  const handleContinueLocal = () => {
    localStorage.setItem('cinediario_onboarding_decided', 'true');
    setIsOnboardingOpen(false);
    showToast('Modalità locale attiva. Puoi connettere Google in ogni momento!', 'info');
  };

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

    // 2. Save directly to user's Google Sheet if authenticated
    if (googleAccessToken && spreadsheetId) {
      try {
        await appendEntryToGoogleSheet(spreadsheetId, googleAccessToken, entry);
        showToast(
          'Film salvato nel tuo foglio Google Sheets!',
          'success',
          spreadsheetUrl || undefined,
          'Vedi su Sheets'
        );
        return true;
      } catch (sheetErr: any) {
        console.warn('Errore salvataggio su Google Sheets:', sheetErr);
        showToast('Salvato in locale (errore di sincronizzazione con Google Sheets).', 'info');
        return true;
      }
    }

    // 3. Save via GAS Web App URL if configured
    if (settings.gasWebAppUrl) {
      try {
        const res = await saveDiaryEntryToGAS(settings.gasWebAppUrl, entry);
        showToast(res.message, res.success ? 'success' : 'info');
        return true;
      } catch (gasErr: any) {
        showToast('Film salvato nella memoria locale.', 'info');
        return true;
      }
    }

    // 4. Local mode confirmed
    showToast('Film salvato nella memoria locale del dispositivo.', 'success');
    return true;
  };

  // Handle deleting entry
  const handleDeleteEntry = async (id: string) => {
    // Immediate state & local storage removal
    const updated = entries.filter((e) => String(e.id) !== String(id));
    setEntries(updated);
    setStoredEntries(updated);

    // If Google Sheet is active, clear row from sheet
    if (googleAccessToken && spreadsheetId) {
      try {
        await deleteEntryFromGoogleSheet(spreadsheetId, googleAccessToken, id);
        showToast('Film eliminato dal foglio Google.', 'success');
        return;
      } catch {
        // silent fallback
      }
    }

    // Else if GAS configured
    if (settings.gasWebAppUrl) {
      await deleteDiaryEntryGAS(settings.gasWebAppUrl, id);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navbar with Google User status & PWA button */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        diaryCount={entries.length}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenInstallGuide={() => setIsIOSGuideOpen(true)}
        user={googleUser}
        onOpenAuthModal={() => setIsOnboardingOpen(true)}
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
            isGasConfigured={Boolean(spreadsheetId || settings.gasWebAppUrl)}
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
            user={googleUser}
            spreadsheetId={spreadsheetId}
            spreadsheetUrl={spreadsheetUrl}
            isSyncing={isSyncing}
            onSignInGoogle={handleGoogleSignIn}
            onSignOutGoogle={handleGoogleSignOut}
            onSyncGoogle={handleManualSync}
            entriesCount={entries.length}
          />
        )}
      </main>

      {/* Modal: Onboarding First Time / Google Connect */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSignInWithGoogle={handleGoogleSignIn}
        onContinueLocal={handleContinueLocal}
        isCreatingSheet={isCreatingSheet}
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
              user={googleUser}
              spreadsheetId={spreadsheetId}
              spreadsheetUrl={spreadsheetUrl}
              isSyncing={isSyncing}
              onSignInGoogle={handleGoogleSignIn}
              onSignOutGoogle={handleGoogleSignOut}
              onSyncGoogle={handleManualSync}
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

      {/* Modal: Assistente Risoluzione Dominio OAuth / GAS (origin_mismatch / unauthorized-domain) */}
      <UnauthorizedDomainModal
        isOpen={isUnauthorizedDomainOpen}
        onClose={() => setIsUnauthorizedDomainOpen(false)}
        onRetry={() => {
          setIsUnauthorizedDomainOpen(false);
          handleGoogleSignIn();
        }}
        onContinueLocal={() => {
          setIsUnauthorizedDomainOpen(false);
          handleContinueLocal();
        }}
        onOpenGASSetup={() => {
          setIsUnauthorizedDomainOpen(false);
          setActiveTab('setup');
        }}
        errorType={oauthErrorType}
      />

      {/* Global Toast Notification with Optional Google Sheet Direct Link */}
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
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
