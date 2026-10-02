import React, { useState, useMemo } from 'react';
import { Film, Star, Calendar, MapPin, Search, RefreshCw, Trash2, Edit3, MessageSquare, LayoutGrid, List, SlidersHorizontal, Sparkles } from 'lucide-react';
import { DiaryEntry } from '../types';
import { getPosterUrl } from '../services/tmdb';
import { MoviePoster } from './MoviePoster';

interface DiaryHistoryProps {
  entries: DiaryEntry[];
  loading: boolean;
  onRefresh: () => void;
  onEditEntry: (entry: DiaryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onGoToSearch: () => void;
  isGasConfigured: boolean;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc' | 'title'>('date_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'detailed' | 'list'>('grid');

  // Compute unique years from entries
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    entries.forEach((e) => {
      if (e.watch_date && e.watch_date.length >= 4) {
        years.add(e.watch_date.substring(0, 4));
      }
    });
    return Array.from(years).sort().reverse();
  }, [entries]);

  // Compute unique locations
  const availableLocations = useMemo(() => {
    const locs = new Set<string>();
    entries.forEach((e) => {
      if (e.location && e.location.trim()) {
        locs.add(e.location.trim());
      }
    });
    return Array.from(locs).sort();
  }, [entries]);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        // Search filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = entry.title.toLowerCase().includes(q);
          const matchComments = entry.comments ? entry.comments.toLowerCase().includes(q) : false;
          const matchLoc = entry.location ? entry.location.toLowerCase().includes(q) : false;
          if (!matchTitle && !matchComments && !matchLoc) return false;
        }

        // Year filter
        if (selectedYear !== 'all') {
          if (!entry.watch_date || !entry.watch_date.startsWith(selectedYear)) {
            return false;
          }
        }

        // Rating filter
        if (selectedRatingFilter !== 'all') {
          if (entry.rating === null || entry.rating === undefined) {
            if (selectedRatingFilter !== 'unrated') return false;
          } else {
            const minRating = Number(selectedRatingFilter);
            if (entry.rating < minRating) return false;
          }
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
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [entries, searchTerm, selectedYear, selectedRatingFilter, selectedLocation, sortBy]);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-amber-400" />
              Diario Cinematografico
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              {entries.length} {entries.length === 1 ? 'Film' : 'Film Registrati'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isGasConfigured
              ? 'Sincronizzato automaticamente con Google Sheets.'
              : 'Salvataggio in locale attivo (collega Google Sheets nelle impostazioni per sincronizzare).'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
            title="Ricarica storico da Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Aggiorna</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Locandine"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'detailed' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Dettagliata"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'list' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Tabellare Compatta"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search inside diary */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca per titolo o note..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Filter Year Seen */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="all">Tutti gli Anni di Visione</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  Anno {y}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Rating */}
          <div>
            <select
              value={selectedRatingFilter}
              onChange={(e) => setSelectedRatingFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="all">Tutti i Voti</option>
              <option value="9">★ 9 o 10 (Capolavori)</option>
              <option value="8">★ 8 o superiore</option>
              <option value="7">★ 7 o superiore</option>
              <option value="6">★ 6 o superiore</option>
              <option value="unrated">Senza voto assegnato</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="date_desc">Più recenti visti prima</option>
              <option value="date_asc">Meno recenti visti prima</option>
              <option value="rating_desc">Voto più alto</option>
              <option value="rating_asc">Voto più basso</option>
              <option value="title">Titolo Alfabetico (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Location chips if available */}
        {availableLocations.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-thin text-xs text-slate-400">
            <span className="font-semibold text-slate-500 mr-1">Luogo:</span>
            <button
              onClick={() => setSelectedLocation('all')}
              className={`px-2 py-0.5 rounded-md ${
                selectedLocation === 'all'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400'
              }`}
            >
              Tutti ({entries.length})
            </button>
            {availableLocations.map((loc) => {
              const count = entries.filter((e) => e.location === loc).length;
              return (
                <button
                  key={loc}
                  onClick={() => setSelectedLocation(loc)}
                  className={`px-2 py-0.5 rounded-md whitespace-nowrap ${
                    selectedLocation === loc
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  {loc} ({count})
                </button>
              );
            })}
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
        <div className="text-center py-12 px-4 bg-slate-900/30 rounded-xl border border-slate-800">
          <p className="text-sm text-slate-400">Nessun film corrisponde ai filtri selezionati.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedYear('all');
              setSelectedRatingFilter('all');
              setSelectedLocation('all');
            }}
            className="mt-3 text-xs text-amber-400 hover:underline"
          >
            Azzera tutti i filtri
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Visual Poster Gallery */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredEntries.map((entry) => {
            const year = entry.watch_date ? entry.watch_date.substring(0, 4) : '';
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
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        {entry.watch_date}
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
                      title="Modifica dettagli"
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
                      title="Elimina film"
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

                    {entry.location && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
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
            const year = entry.watch_date ? entry.watch_date.substring(0, 4) : '';
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
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                          {entry.watch_date && (
                            <span className="flex items-center gap-1 text-slate-300">
                              <Calendar className="w-3.5 h-3.5 text-amber-400" />
                              Visto il: <strong>{entry.watch_date}</strong>
                            </span>
                          )}
                          {entry.location && (
                            <span className="flex items-center gap-1 text-slate-300">
                              <MapPin className="w-3.5 h-3.5 text-amber-400" />
                              Presso: <strong>{entry.location}</strong>
                            </span>
                          )}
                        </div>
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
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Modifica"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Eliminare "${entry.title}"?`)) onDeleteEntry(entry.id);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white"
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
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Titolo</th>
                <th className="py-3 px-4">Data Visione</th>
                <th className="py-3 px-4">Luogo</th>
                <th className="py-3 px-4">Voto</th>
                <th className="py-3 px-4">Commenti</th>
                <th className="py-3 px-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                    <Film className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>{entry.title}</span>
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
                      className="text-amber-400 hover:underline mr-3"
                    >
                      Modifica
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Eliminare "${entry.title}"?`)) onDeleteEntry(entry.id);
                      }}
                      className="text-rose-400 hover:underline"
                    >
                      Elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
