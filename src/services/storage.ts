import { AppSettings, DiaryEntry } from '../types';

const DIARY_STORAGE_KEY = 'cinediario_entries_v1';
const SETTINGS_STORAGE_KEY = 'cinediario_settings_v1';

// Reliable working TMDB API key (v3) tested for search & discover
export const DEFAULT_TMDB_API_KEY = '2dca580c2a14b55200e784d157207b4d';
const OLD_INVALID_KEYS = ['f42bb84501239c4d924d673752e50cf6', 'YOUR_API_KEY'];

const INITIAL_DEMO_ENTRIES: DiaryEntry[] = [
  {
    id: '872585',
    title: 'Oppenheimer',
    poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    watch_date: '2023-08-25',
    location: 'Cinema Arcadia (Sala Energia)',
    rating: 9.5,
    comments: 'Esperienza immersiva straordinaria. Il sonoro durante il test Trinity fa tremare la sala. Cillian Murphy sublime.',
    timestamp: '2023-08-25T23:15:00.000Z',
    release_year: '2023'
  },
  {
    id: '238',
    title: 'Il padrino',
    poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    watch_date: '2023-11-12',
    location: 'Casa - Home Cinema',
    rating: 10,
    comments: 'Rivederlo in 4K restaurato è pura magia. La regia di Coppola e l\'interpretazione di Marlon Brando restano inarrivabili.',
    timestamp: '2023-11-12T22:30:00.000Z',
    release_year: '1972'
  },
  {
    id: '637',
    title: 'La vita è bella',
    poster_path: '/3e04rLqUj9QnQ3ZfU7cWw1E1e4A.jpg',
    watch_date: '2024-01-27',
    location: 'Casa - Con la famiglia',
    rating: 9,
    comments: 'Un capolavoro che fa ridere e piangere ad ogni visione. Benigni e Nicoletta Braschi indimenticabili.',
    timestamp: '2024-01-27T21:40:00.000Z',
    release_year: '1997'
  },
  {
    id: '693134',
    title: 'Dune - Parte due',
    poster_path: '/czembW0Rk1Ke7ra2NsEtSYeePP3.jpg',
    watch_date: '2024-03-02',
    location: 'Cinema IMAX',
    rating: 9,
    comments: 'Epico su scala monumentale. Fotografia di Greig Fraser pazzesca e colonna sonora di Hans Zimmer travolgente.',
    timestamp: '2024-03-02T23:50:00.000Z',
    release_year: '2024'
  }
];

export function getStoredEntries(): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(DIARY_STORAGE_KEY);
    if (!raw) {
      // Initialize with demo entries if first time
      setStoredEntries(INITIAL_DEMO_ENTRIES);
      return INITIAL_DEMO_ENTRIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_DEMO_ENTRIES;
  } catch (e) {
    console.error('Error loading stored diary entries:', e);
    return INITIAL_DEMO_ENTRIES;
  }
}

export function setStoredEntries(entries: DiaryEntry[]): void {
  try {
    localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Error saving diary entries to localStorage:', e);
  }
}

export function getStoredSettings(): AppSettings {
  const defaults: AppSettings = {
    gasWebAppUrl: '',
    tmdbApiKey: DEFAULT_TMDB_API_KEY,
    offlineModeOnly: false
  };

  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    let key = parsed.tmdbApiKey;
    if (!key || OLD_INVALID_KEYS.includes(key)) {
      key = DEFAULT_TMDB_API_KEY;
    }
    return {
      gasWebAppUrl: parsed.gasWebAppUrl || '',
      tmdbApiKey: key,
      offlineModeOnly: !!parsed.offlineModeOnly
    };
  } catch (e) {
    console.error('Error reading settings:', e);
    return defaults;
  }
}

export function setStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}
