import React, { useState, useEffect, useTransition } from 'react';
import { Search, Calendar, Film, Star, Loader2, Sparkles, Check, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { TMDBMovie, DiaryEntry } from '../types';
import { searchMovies, discoverMoviesByYear } from '../services/tmdb';
import { MoviePoster } from './MoviePoster';

interface SearchAndDiscoverProps {
  apiKey: string;
  diaryEntries: DiaryEntry[];
  onSelectMovie: (movie: TMDBMovie) => void;
  onOpenSettings: () => void;
}

export const SearchAndDiscover: React.FC<SearchAndDiscoverProps> = ({
  apiKey,
  diaryEntries,
  onSelectMovie,
  onOpenSettings
}) => {
  const [mode, setMode] = useState<'text' | 'discover'>('text');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [, startTransition] = useTransition();

  // Generate years list from current year down to 1920
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i);

  // Existing movie IDs in diary for quick visual check
  const loggedIds = new Set(diaryEntries.map((e) => String(e.id)));

  // Load movies on mode/year/search change
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      if (mode === 'text') {
        if (!searchQuery.trim()) {
          // If search is empty, load trending or year discover as initial view
          setLoading(true);
          const data = await discoverMoviesByYear(currentYear, apiKey, 1);
          if (!isCancelled) {
            setMovies(data.results);
            setTotalPages(data.total_pages);
            setTotalResults(data.total_results);
            setLoading(false);
          }
          return;
        }

        setLoading(true);
        const data = await searchMovies(searchQuery, apiKey, page);
        if (!isCancelled) {
          setMovies(data.results);
          setTotalPages(data.total_pages);
          setTotalResults(data.total_results);
          setLoading(false);
        }
      } else {
        // Discover by year
        setLoading(true);
        const data = await discoverMoviesByYear(selectedYear, apiKey, page);
        if (!isCancelled) {
          setMovies(data.results);
          setTotalPages(data.total_pages);
          setTotalResults(data.total_results);
          setLoading(false);
        }
      }
    }

    const timer = setTimeout(() => {
      loadData();
    }, mode === 'text' ? 350 : 0);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [mode, searchQuery, selectedYear, page, apiKey, currentYear]);

  const handleModeChange = (newMode: 'text' | 'discover') => {
    startTransition(() => {
      setMode(newMode);
      setPage(1);
    });
  };

  const handleYearChange = (year: number) => {
    startTransition(() => {
      setSelectedYear(year);
      setPage(1);
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Banner / Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-400" />
            Cerca & Esplora Film (TMDB)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tutti i titoli e le trame sono recuperati in italiano (<code className="text-amber-300">language=it-IT</code>).
          </p>
        </div>

        {/* Toggle between Text search & Year discover */}
        <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => handleModeChange('text')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              mode === 'text'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Ricerca Testuale</span>
          </button>

          <button
            onClick={() => handleModeChange('discover')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              mode === 'discover'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Esplora per Anno</span>
          </button>
        </div>
      </div>

      {/* Control bar according to Mode */}
      {mode === 'text' ? (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cerca per titolo in italiano o originale (es. Oppenheimer, Dune, Il padrino...)"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-inner transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded-md"
              >
                Cancella
              </button>
            )}
          </div>

          {/* Quick suggestion pills */}
          {!searchQuery && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-500">Suggeriti:</span>
              {['Oppenheimer', 'Dune', 'Interstellar', 'La vita è bella', 'Pulp Fiction', 'Nuovo Cinema Paradiso'].map(
                (title) => (
                  <button
                    key={title}
                    onClick={() => {
                      setSearchQuery(title);
                      setPage(1);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-amber-500/40 transition-colors"
                  >
                    {title}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ) : (
        /* Year-by-Year Discover Selector */
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <label htmlFor="year-select" className="text-sm font-semibold text-white">
                Seleziona l'Anno di Uscita:
              </label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="bg-slate-950 border border-amber-500/40 text-amber-400 font-bold px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-400">
              Film più popolari del <span className="font-bold text-amber-400">{selectedYear}</span>
            </div>
          </div>

          {/* Quick Year jump chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {[2026, 2025, 2024, 2023, 2022, 2020, 2015, 2010, 2000, 1994, 1988, 1972, 1966].map((yr) => (
              <button
                key={yr}
                onClick={() => handleYearChange(yr)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedYear === yr
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          {loading ? (
            <span className="flex items-center gap-1.5 text-amber-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Caricamento risultati in lingua italiana...
            </span>
          ) : (
            <span>
              {mode === 'text' && searchQuery ? (
                <>Risultati per &ldquo;<strong className="text-white">{searchQuery}</strong>&rdquo; ({totalResults} trovati)</>
              ) : (
                <>Film in evidenza per il <strong className="text-white">{mode === 'text' ? currentYear : selectedYear}</strong></>
              )}
            </span>
          )}
        </span>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-300">
              {page} / {Math.min(totalPages, 50)}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="p-1 rounded bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Movie Results Grid */}
      {loading && movies.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-slate-900 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-2xl border border-slate-800/80">
          <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Nessun film trovato</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Prova a modificare la ricerca o seleziona un altro anno di uscita.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {movies.map((movie) => {
            const isLogged = loggedIds.has(String(movie.id));
            const year = movie.release_date ? movie.release_date.substring(0, 4) : '';

            return (
              <div
                key={movie.id}
                onClick={() => onSelectMovie(movie)}
                className="group relative flex flex-col rounded-xl bg-slate-900 border border-slate-800/80 hover:border-amber-500/60 overflow-hidden shadow-lg hover:shadow-amber-500/10 transition-all duration-200 cursor-pointer hover:-translate-y-1"
              >
                {/* Poster Container */}
                <div className="relative aspect-[2/3] w-full bg-slate-950 overflow-hidden">
                  <MoviePoster
                    posterPath={movie.poster_path}
                    backdropPath={movie.backdrop_path}
                    title={movie.title}
                    year={year}
                    rating={movie.vote_average}
                  />

                  {/* Rating Badge Top Left */}
                  {movie.vote_average !== undefined && movie.vote_average > 0 && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-[11px] font-bold text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{movie.vote_average.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Already logged indicator */}
                  {isLogged && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/90 text-slate-950 text-[10px] font-extrabold shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Nel Diario</span>
                    </div>
                  )}

                  {/* Hover Overlay Button */}
                  <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center">
                    <span className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shadow-lg hover:bg-amber-400 transition-colors">
                      + Registra Visione
                    </span>
                    {movie.overview && (
                      <p className="text-[11px] text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                        {movie.overview}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Info Footer */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                      {movie.title}
                    </h4>
                    {movie.original_title && movie.original_title !== movie.title && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                        {movie.original_title}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">{year || 'N/D'}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/80 group-hover:text-amber-300">
                      Dettagli &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
