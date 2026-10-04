import React, { useState, useMemo } from 'react';
import {
  Film,
  Star,
  Calendar,
  MapPin,
  Search,
  RefreshCw,
  Trash2,
  Edit3,
  MessageSquare,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Sparkles,
  Download,
  FileSpreadsheet,
  X,
  Filter,
  Check,
  Tag
} from 'lucide-react';
import { DiaryEntry } from '../types';
import { MoviePoster } from './MoviePoster';
import { getGenreNamesFromIds } from '../services/tmdb';

interface DiaryHistoryProps {
  entries: DiaryEntry[];
  loading: boolean;
  onRefresh: () => void;
  onEditEntry: (entry: DiaryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onGoToSearch: () => void;
  isGasConfigured: boolean;
}

// Helper to extract genres from a diary entry
export function getEntryGenres(entry: DiaryEntry): string[] {
  if (entry.genres && entry.genres.length > 0) return entry.genres;
  if (entry.genre_ids && entry.genre_ids.length > 0) return getGenreNamesFromIds(entry.genre_ids);
  return [];
}

export const DiaryHistory: React.FC<DiaryHistoryProps> = ({
  entries,
  loading,
  onRefresh,
  onEditEntry,
  onDeleteEntry,
  onGoToSearch,
  isGasConfigured
}) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc' | 'title_asc' | 'title_desc' | 'year_desc'
  >('date_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'detailed' | 'list'>('grid');

  // UI state for CSV Export feedback
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Compute unique years from entries (watch date and release year)
  const availableYears = useMemo(() => {
    const yearCountMap = new Map<string, number>();
    entries.forEach((e) => {
      const y = e.watch_date && e.watch_date.length >= 4 ? e.watch_date.substring(0, 4) : e.release_year;
      if (y) {
        yearCountMap.set(y, (yearCountMap.get(y) || 0) + 1);
      }
    });
    return Array.from(yearCountMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries]);

  // Compute unique genres with movie count from entries
  const availableGenres = useMemo(() => {
    const genreMap = new Map<string, number>();
    entries.forEach((e) => {
      const genres = getEntryGenres(e);
      genres.forEach((g) => {
        if (g && g.trim()) {
          const norm = g.trim();
          genreMap.set(norm, (genreMap.get(norm) || 0) + 1);
        }
      });
    });
    return Array.from(genreMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  // Compute unique locations with count
  const availableLocations = useMemo(() => {
    const locMap = new Map<string, number>();
    entries.forEach((e) => {
      if (e.location && e.location.trim()) {
        const norm = e.location.trim();
        locMap.set(norm, (locMap.get(norm) || 0) + 1);
      }
    });
    return Array.from(locMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  // Check if any filter is active
  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedYear !== 'all' ||
    selectedRatingFilter !== 'all' ||
    selectedGenre !== 'all' ||
    selectedLocation !== 'all';

  // Reset all filters in 1 click
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedYear('all');
    setSelectedRatingFilter('all');
    setSelectedGenre('all');
    setSelectedLocation('all');
  };

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        // Search filter: title, original title, comments, location, genres
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = entry.title.toLowerCase().includes(q);
          const matchOrig = entry.original_title ? entry.original_title.toLowerCase().includes(q) : false;
          const matchComments = entry.comments ? entry.comments.toLowerCase().includes(q) : false;
          const matchLoc = entry.location ? entry.location.toLowerCase().includes(q) : false;
          const matchGenre = getEntryGenres(entry).some((g) => g.toLowerCase().includes(q));
          if (!matchTitle && !matchOrig && !matchComments && !matchLoc && !matchGenre) return false;
        }

        // Year filter (matches watch date year or release year)
        if (selectedYear !== 'all') {
          const watchYear = entry.watch_date && entry.watch_date.length >= 4 ? entry.watch_date.substring(0, 4) : '';
          const relYear = entry.release_year || '';
          if (watchYear !== selectedYear && relYear !== selectedYear) {
            return false;
          }
        }

        // Rating filter
        if (selectedRatingFilter !== 'all') {
          if (entry.rating === null || entry.rating === undefined) {
            if (selectedRatingFilter !== 'unrated') return false;
          } else {
            if (selectedRatingFilter === 'unrated') return false;
            if (selectedRatingFilter === '10') {
              if (entry.rating !== 10) return false;
            } else if (selectedRatingFilter === '9+') {
              if (entry.rating < 9) return false;
            } else if (selectedRatingFilter === '8+') {
              if (entry.rating < 8) return false;
            } else if (selectedRatingFilter === '7+') {
              if (entry.rating < 7) return false;
            } else if (selectedRatingFilter === '6+') {
              if (entry.rating < 6) return false;
            } else if (selectedRatingFilter === 'under6') {
              if (entry.rating >= 6) return false;
            } else {
              const exact = Number(selectedRatingFilter);
              if (!isNaN(exact) && entry.rating !== exact) return false;
            }
          }
        }

        // Genre filter
        if (selectedGenre !== 'all') {
          const entryGenres = getEntryGenres(entry);
          const hasG = entryGenres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase());
          if (!hasG) return false;
        }

        // Location filter
        if (selectedLocation !== 'all') {
          if (!entry.location || !entry.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          const dateA = a.watch_date || a.timestamp || '';
          const dateB = b.watch_date || b.timestamp || '';
          return dateB.localeCompare(dateA);
        }
        if (sortBy === 'date_asc') {
          const dateA = a.watch_date || a.timestamp || '';
          const dateB = b.watch_date || b.timestamp || '';
          return dateA.localeCompare(dateB);
        }
        if (sortBy === 'rating_desc') {
          return (b.rating || 0) - (a.rating || 0);
        }
        if (sortBy === 'rating_asc') {
          return (a.rating || 0) - (b.rating || 0);
        }
        if (sortBy === 'title_asc') {
          return a.title.localeCompare(b.title, 'it');
        }
        if (sortBy === 'title_desc') {
          return b.title.localeCompare(a.title, 'it');
        }
        if (sortBy === 'year_desc') {
          const yearA = a.release_year || (a.watch_date ? a.watch_date.substring(0, 4) : '');
          const yearB = b.release_year || (b.watch_date ? b.watch_date.substring(0, 4) : '');
          return yearB.localeCompare(yearA);
        }
        return 0;
      });
  }, [entries, searchTerm, selectedYear, selectedRatingFilter, selectedGenre, selectedLocation, sortBy]);

  // CSV Export Handler
  const handleExportCSV = (exportFilteredOnly = false) => {
    const listToExport = exportFilteredOnly ? filteredEntries : entries;
    if (listToExport.length === 0) return;

    setIsExporting(true);
    try {
      const headers = [
        'ID',
        'Titolo',
        'Titolo Originale',
        'Anno Uscita',
        'Data Visione',
        'Luogo',
        'Voto (1-10)',
        'Generi',
        'Note e Commenti',
        'Locandina URL',
        'Data Registrazione'
      ];

      const escapeCSV = (val: any): string => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = listToExport.map((e) => {
        const genreStr = getEntryGenres(e).join(', ');
        const posterUrl = e.poster_path
          ? e.poster_path.startsWith('http')
            ? e.poster_path
            : `https://image.tmdb.org/t/p/w500${e.poster_path}`
          : '';

        return [
          escapeCSV(e.id),
          escapeCSV(e.title),
          escapeCSV(e.original_title || ''),
          escapeCSV(e.release_year || (e.watch_date ? e.watch_date.substring(0, 4) : '')),
          escapeCSV(e.watch_date || ''),
          escapeCSV(e.location || ''),
          escapeCSV(e.rating !== null && e.rating !== undefined ? e.rating : ''),
          escapeCSV(genreStr),
          escapeCSV(e.comments || ''),
          escapeCSV(posterUrl),
          escapeCSV(e.timestamp || '')
        ];
      });

      // UTF-8 Byte Order Mark (\uFEFF) for full Excel and Google Sheets accent support
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);

      const now = new Date().toISOString().split('T')[0];
      const filename =
        exportFilteredOnly && filteredEntries.length !== entries.length
          ? `CineDiario_${filteredEntries.length}_Film_Filtrati_${now}.csv`
          : `CineDiario_Tutti_${entries.length}_Film_${now}.csv`;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportNotice(`Scaricato: ${filename} (${listToExport.length} film)`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      console.error('Errore esportazione CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-16">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white font-serif flex items-center gap-2">
              <Film className="w-5 h-5 text-amber-400" />
              Diario Cinematografico
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              {entries.length} {entries.length === 1 ? 'Film' : 'Film'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isGasConfigured
              ? 'Sincronizzato sul tuo foglio di calcolo cloud.'
              : 'Salvataggio attivo sul dispositivo attuale.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Export CSV Button (Predisposizione estrazione CSV) */}
          <div className="relative inline-flex items-center">
            <button
              onClick={() => handleExportCSV(hasActiveFilters)}
              disabled={entries.length === 0 || isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/25 to-teal-600/25 hover:from-emerald-600/35 hover:to-teal-600/35 text-emerald-300 text-xs font-bold border border-emerald-500/40 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 cursor-pointer"
              title={
                hasActiveFilters
                  ? `Esporta i ${filteredEntries.length} film filtrati in un file CSV per Excel/Sheets`
                  : `Esporta tutti i ${entries.length} film in formato CSV per Excel/Sheets`
              }
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Esporta CSV
                {hasActiveFilters && filteredEntries.length !== entries.length
                  ? ` (${filteredEntries.length})`
                  : ''}
              </span>
              <Download className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Ricarica storico e sincronizza"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Aggiorna</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Galleria Locandine"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'detailed' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Recensioni Dettagliata"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Tabellare Compatta"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Export notification snackbar */}
      {exportNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* BARRA DI FILTRAGGIO AVANZATA: Anno, Voto, Genere & Ricerca */}
      {/* ========================================================= */}
      <div className="bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-lg space-y-3.5">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
          <div className="flex items-center gap-2 text-amber-400">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Filtra i Film del Diario</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 hover:underline cursor-pointer lowercase first-letter:uppercase"
            >
              <X className="w-3 h-3" />
              <span>Azzera tutti i filtri</span>
            </button>
          )}
        </div>

        {/* 5-Column Primary Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Search Box */}
          <div className="relative lg:col-span-1 sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca titolo, note, generi..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Filter by YEAR (Anno) */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-xs focus:outline-none focus:border-amber-500 transition-colors ${
                selectedYear !== 'all'
                  ? 'border-amber-500/60 text-amber-300 font-bold bg-amber-500/10'
                  : 'border-slate-800 text-slate-300'
              }`}
            >
              <option value="all">Tutti gli Anni</option>
              {availableYears.map(([year, count]) => (
                <option key={year} value={year}>
                  Anno {year} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filter by RATING (Voto) */}
          <div>
            <select
              value={selectedRatingFilter}
              onChange={(e) => setSelectedRatingFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-xs focus:outline-none focus:border-amber-500 transition-colors ${
                selectedRatingFilter !== 'all'
                  ? 'border-amber-500/60 text-amber-300 font-bold bg-amber-500/10'
                  : 'border-slate-800 text-slate-300'
              }`}
            >
              <option value="all">Tutti i Voti</option>
              <option value="10">★ 10 (Perfezione)</option>
              <option value="9+">★ 9 o 10 (Capolavori)</option>
              <option value="8+">★ 8 o superiore (Ottimi)</option>
              <option value="7+">★ 7 o superiore (Buoni)</option>
              <option value="6+">★ 6 o superiore (Sufficienti)</option>
              <option value="under6">★ Meno di 6 (Insufficienti)</option>
              <option value="unrated">Senza voto assegnato</option>
            </select>
          </div>

          {/* 4. Filter by GENRE (Genere) */}
          <div>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-xs focus:outline-none focus:border-amber-500 transition-colors ${
                selectedGenre !== 'all'
                  ? 'border-amber-500/60 text-amber-300 font-bold bg-amber-500/10'
                  : 'border-slate-800 text-slate-300'
              }`}
            >
              <option value="all">Tutti i Generi</option>
              {availableGenres.map(([genre, count]) => (
                <option key={genre} value={genre}>
                  {genre} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* 5. Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="date_desc">Più recenti visti prima</option>
              <option value="date_asc">Meno recenti visti prima</option>
              <option value="rating_desc">Voto più alto</option>
              <option value="rating_asc">Voto più basso</option>
              <option value="title_asc">Titolo (A &rarr; Z)</option>
              <option value="title_desc">Titolo (Z &rarr; A)</option>
              <option value="year_desc">Anno di Uscita</option>
            </select>
          </div>
        </div>

        {/* Quick Genre Chips for 1-Tap Filtering (if available) */}
        {availableGenres.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-thin text-xs text-slate-400">
            <span className="font-semibold text-slate-500 mr-1 flex items-center gap-1 text-[11px] flex-shrink-0">
              <Tag className="w-3 h-3 text-amber-400" /> Generi:
            </span>
            <button
              onClick={() => setSelectedGenre('all')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors flex-shrink-0 cursor-pointer ${
                selectedGenre === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              Tutti
            </button>
            {availableGenres.map(([genre, count]) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(selectedGenre === genre ? 'all' : genre)}
                className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer ${
                  selectedGenre === genre
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {genre} <span className="opacity-60 text-[10px]">({count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Location Chips for 1-Tap Filtering (if available) */}
        {availableLocations.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 pb-0.5 scrollbar-thin text-xs text-slate-400">
            <span className="font-semibold text-slate-500 mr-1 flex items-center gap-1 text-[11px] flex-shrink-0">
              <MapPin className="w-3 h-3 text-amber-400" /> Luoghi:
            </span>
            <button
              onClick={() => setSelectedLocation('all')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors flex-shrink-0 cursor-pointer ${
                selectedLocation === 'all'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              Tutti ({entries.length})
            </button>
            {availableLocations.map(([loc, count]) => (
              <button
                key={loc}
                onClick={() => setSelectedLocation(selectedLocation === loc ? 'all' : loc)}
                className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer ${
                  selectedLocation === loc
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {loc} <span className="opacity-60 text-[10px]">({count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Active Filters Summary Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-slate-300">
              <span className="text-slate-400">Risultati filtrati:</span>
              <span className="font-bold text-amber-400">
                {filteredEntries.length} su {entries.length} film
              </span>

              {selectedYear !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px]">
                  Anno: {selectedYear}
                  <button onClick={() => setSelectedYear('all')} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedRatingFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px]">
                  Voto: {selectedRatingFilter}
                  <button onClick={() => setSelectedRatingFilter('all')} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedGenre !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px]">
                  Genere: {selectedGenre}
                  <button onClick={() => setSelectedGenre('all')} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedLocation !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px]">
                  Luogo: {selectedLocation}
                  <button onClick={() => setSelectedLocation('all')} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                  &ldquo;{searchTerm}&rdquo;
                  <button onClick={() => setSearchTerm('')} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <button
              onClick={() => handleExportCSV(true)}
              className="text-emerald-400 hover:text-emerald-300 underline font-semibold text-[11px] cursor-pointer"
            >
              Scarica solo questi {filteredEntries.length} film in CSV &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {entries.length === 0 ? (
        <div className="text-center py-20 px-4 bg-slate-900/30 rounded-2xl border border-slate-800/80">
          <Film className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white font-serif">Il tuo diario cinematografico è vuoto</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Inizia a registrare i tuoi film preferiti cercando per titolo o esplorando per anno con TMDB.
          </p>
          <button
            onClick={onGoToSearch}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-105 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Cerca e Aggiungi il Primo Film
          </button>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-14 px-4 bg-slate-900/30 rounded-2xl border border-slate-800">
          <Filter className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white font-serif">Nessun film corrisponde ai filtri selezionati</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Prova a modificare i filtri per anno, voto o genere oppure azzerali per vedere tutti i {entries.length} film registrati.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors cursor-pointer"
          >
            Azzera tutti i filtri
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Visual Poster Gallery */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredEntries.map((entry) => {
            const year = entry.release_year || (entry.watch_date ? entry.watch_date.substring(0, 4) : '');
            const entryGenres = getEntryGenres(entry);

            return (
              <div
                key={entry.id}
                className="group relative flex flex-col rounded-xl bg-slate-900 border border-slate-800/90 overflow-hidden shadow-lg hover:border-amber-500/60 hover:shadow-amber-500/10 transition-all duration-200"
              >
                {/* Poster image */}
                <div className="relative aspect-[2/3] w-full bg-slate-950 overflow-hidden">
                  <MoviePoster
                    posterPath={entry.poster_path}
                    title={entry.title}
                    year={year}
                    rating={entry.rating}
                  />

                  {/* Rating Badge */}
                  {entry.rating !== null && entry.rating !== undefined && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-md border border-amber-500/30 text-xs font-extrabold text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{entry.rating}</span>
                    </div>
                  )}

                  {/* Watch date badge */}
                  {entry.watch_date && (
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] px-2 py-0.5 rounded bg-slate-950/85 backdrop-blur-sm text-slate-300 border border-slate-800">
                      <span className="flex items-center gap-1 truncate">
                        <Calendar className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        <span>{entry.watch_date}</span>
                      </span>
                    </div>
                  )}

                  {/* Action buttons on hover */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEntry(entry);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-amber-500 text-slate-300 hover:text-slate-950 transition-colors shadow-md"
                      title="Modifica dettagli film"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Sei sicuro di voler eliminare "${entry.title}" dal diario?`)) {
                          onDeleteEntry(entry.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-rose-500 text-slate-300 hover:text-white transition-colors shadow-md"
                      title="Elimina film dal diario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card footer details */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                      {entry.title}
                    </h4>

                    {/* Genres tags */}
                    {entryGenres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entryGenres.slice(0, 2).map((g) => (
                          <span
                            key={g}
                            onClick={() => setSelectedGenre(g)}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 hover:text-amber-300 hover:bg-slate-700 cursor-pointer"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}

                    {entry.location && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1.5">
                        <MapPin className="w-3 h-3 text-amber-400/80 flex-shrink-0" />
                        <span className="truncate">{entry.location}</span>
                      </p>
                    )}
                  </div>

                  {entry.comments && (
                    <p className="text-[11px] text-slate-300 mt-2 line-clamp-2 italic bg-slate-950/40 p-1.5 rounded border border-slate-800/80">
                      &ldquo;{entry.comments}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'detailed' ? (
        /* Detailed Review Cards */
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
            const year = entry.release_year || (entry.watch_date ? entry.watch_date.substring(0, 4) : '');
            const entryGenres = getEntryGenres(entry);

            return (
              <div
                key={entry.id}
                className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800/90 shadow-lg hover:border-amber-500/40 transition-colors"
              >
                <div className="w-24 sm:w-28 flex-shrink-0 aspect-[2/3] rounded-xl bg-slate-950 overflow-hidden border border-slate-800">
                  <MoviePoster
                    posterPath={entry.poster_path}
                    title={entry.title}
                    year={year}
                    size="w342"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-white font-serif">
                          {entry.title}
                        </h4>
                        {entry.original_title && entry.original_title !== entry.title && (
                          <p className="text-xs text-slate-500 italic">{entry.original_title}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                          {entry.watch_date && (
                            <span className="flex items-center gap-1 text-slate-300">
                              <Calendar className="w-3.5 h-3.5 text-amber-400" />
                              Visto il: {entry.watch_date}
                            </span>
                          )}
                          {entry.location && (
                            <span className="flex items-center gap-1 text-slate-300">
                              <MapPin className="w-3.5 h-3.5 text-amber-400" />
                              {entry.location}
                            </span>
                          )}
                          {year && (
                            <span className="text-slate-500">
                              Anno: {year}
                            </span>
                          )}
                        </div>

                        {/* Genres */}
                        {entryGenres.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {entryGenres.map((g) => (
                              <button
                                key={g}
                                onClick={() => setSelectedGenre(g)}
                                className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors ${
                                  selectedGenre === g
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {entry.rating !== null && entry.rating !== undefined && (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-extrabold text-sm border border-amber-500/30">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span>{entry.rating} / 10</span>
                          </div>
                        )}
                        <button
                          onClick={() => onEditEntry(entry)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Modifica"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Eliminare "${entry.title}"?`)) onDeleteEntry(entry.id);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                          title="Elimina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {entry.comments ? (
                      <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                        &ldquo;{entry.comments}&rdquo;
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic mt-3">Nessuna recensione o commento registrato.</p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                    Registrato nel diario il: {new Date(entry.timestamp).toLocaleDateString('it-IT')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact List View */
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 shadow-lg">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Titolo</th>
                <th className="py-3 px-4">Generi</th>
                <th className="py-3 px-4">Data Visione</th>
                <th className="py-3 px-4">Luogo</th>
                <th className="py-3 px-4">Voto</th>
                <th className="py-3 px-4">Note</th>
                <th className="py-3 px-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredEntries.map((entry) => {
                const entryGenres = getEntryGenres(entry);
                return (
                  <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <Film className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="line-clamp-1">{entry.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {entryGenres.length > 0 ? (
                        <span className="text-[11px] text-slate-400">{entryGenres.slice(0, 2).join(', ')}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{entry.watch_date || '—'}</td>
                    <td className="py-3 px-4">{entry.location || '—'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {entry.rating !== null ? (
                        <span className="font-bold text-amber-400">★ {entry.rating}/10</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">{entry.comments || '—'}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onEditEntry(entry)}
                        className="text-amber-400 hover:underline mr-3 cursor-pointer"
                      >
                        Modifica
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Eliminare "${entry.title}"?`)) onDeleteEntry(entry.id);
                        }}
                        className="text-rose-400 hover:underline cursor-pointer"
                      >
                        Elimina
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
