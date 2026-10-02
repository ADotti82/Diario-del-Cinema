import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Star, MessageSquare, Save, Loader2, Sparkles, Film, CheckCircle2, AlertCircle } from 'lucide-react';
import { TMDBMovie, DiaryEntry } from '../types';
import { MoviePoster } from './MoviePoster';

interface MovieEntryModalProps {
  movie: TMDBMovie | null;
  existingEntry?: DiaryEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: DiaryEntry) => Promise<boolean>;
}

const COMMON_LOCATIONS = [
  'Cinema',
  'Sala IMAX',
  'Casa - Netflix',
  'Casa - Prime Video',
  'Casa - Disney+',
  'Casa - Apple TV+',
  'Casa - Blu-ray / 4K',
  'Festival del Cinema',
  'In Viaggio / Volo'
];

export const MovieEntryModal: React.FC<MovieEntryModalProps> = ({
  movie,
  existingEntry,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen || !movie) return null;

  // Form states with optional default values
  const [watchDate, setWatchDate] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [rating, setRating] = useState<number | null>(null);
  const [comments, setComments] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initialize or reset form values
  useEffect(() => {
    if (existingEntry) {
      setWatchDate(existingEntry.watch_date || '');
      setLocation(existingEntry.location || '');
      setRating(existingEntry.rating !== null && existingEntry.rating !== undefined ? existingEntry.rating : null);
      setComments(existingEntry.comments || '');
    } else {
      // Default: leave empty so user can decide (all optional) or pick today
      setWatchDate('');
      setLocation('');
      setRating(null);
      setComments('');
    }
    setSaveStatus(null);
    setIsSaving(false);
  }, [movie, existingEntry]);

  const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : '';

  // Quick date shortcuts
  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setWatchDate(today);
  };

  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setWatchDate(d.toISOString().split('T')[0]);
  };

  const clearDate = () => {
    setWatchDate('');
  };

  const getRatingLabel = (val: number | null): string => {
    if (val === null) return 'Nessun voto assegnato (opzionale)';
    if (val === 10) return '10 / 10 ★ Capolavoro Assoluto';
    if (val >= 9) return `${val} / 10 ★ Straordinario`;
    if (val >= 8) return `${val} / 10 ★ Ottimo Film`;
    if (val >= 7) return `${val} / 10 ★ Molto Buono`;
    if (val >= 6) return `${val} / 10 ★ Sufficiente / Godibile`;
    if (val >= 5) return `${val} / 10 ★ Mediocre`;
    return `${val} / 10 ★ Deludente`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);

    const entryToSave: DiaryEntry = {
      id: String(movie.id),
      title: movie.title,
      poster_path: movie.poster_path || '',
      watch_date: watchDate.trim(),
      location: location.trim(),
      rating: rating !== null ? rating : null,
      comments: comments.trim(),
      timestamp: existingEntry?.timestamp || new Date().toISOString(),
      original_title: movie.original_title,
      release_year: releaseYear,
      overview: movie.overview
    };

    try {
      const ok = await onSave(entryToSave);
      if (ok) {
        setSaveStatus({ type: 'success', message: 'Film salvato con successo!' });
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setSaveStatus({ type: 'error', message: 'Errore di salvataggio. Riprova.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveStatus({ type: 'error', message: `Errore: ${msg}` });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden my-6">
        {/* Header with Close */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Film className="w-4 h-4" />
            <span>Registra Visione nel Diario</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Movie Info Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80">
          <div className="flex gap-4 items-start">
            {/* Poster */}
            <div className="w-24 sm:w-28 flex-shrink-0 aspect-[2/3] rounded-xl bg-slate-950 overflow-hidden border border-slate-700/80 shadow-md">
              <MoviePoster
                posterPath={movie.poster_path}
                backdropPath={movie.backdrop_path}
                title={movie.title}
                year={releaseYear}
                rating={movie.vote_average}
                size="w342"
              />
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {releaseYear && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                    {releaseYear}
                  </span>
                )}
                {movie.vote_average !== undefined && movie.vote_average > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 text-xs font-semibold">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> TMDB: {movie.vote_average.toFixed(1)}
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white leading-tight font-serif">
                {movie.title}
              </h3>
              {movie.original_title && movie.original_title !== movie.title && (
                <p className="text-xs text-slate-400 italic mt-0.5">
                  Titolo originale: {movie.original_title}
                </p>
              )}

              {movie.overview && (
                <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                  {movie.overview}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Helpful Info Banner about optional fields */}
        <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs text-amber-300">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong>Tutti i campi sottostanti sono opzionali:</strong> puoi registrare anche film visti anni fa di cui non ricordi con esattezza data o luogo!
          </span>
        </div>

        {/* Data Entry Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {/* Campo 1: Data Visione (Opzionale) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-200">
                <Calendar className="w-4 h-4 text-amber-400" />
                Data Visione <span className="text-[11px] font-normal text-slate-400">(opzionale)</span>
              </label>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={setToday}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  Oggi
                </button>
                <button
                  type="button"
                  onClick={setYesterday}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  Ieri
                </button>
                {watchDate && (
                  <button
                    type="button"
                    onClick={clearDate}
                    className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300"
                  >
                    Cancella
                  </button>
                )}
              </div>
            </div>

            <input
              type="date"
              value={watchDate}
              onChange={(e) => setWatchDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Campo 2: Luogo (Opzionale) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-200">
              <MapPin className="w-4 h-4 text-amber-400" />
              Luogo di Visione <span className="text-[11px] font-normal text-slate-400">(opzionale)</span>
            </label>

            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="es. Cinema Odeon, Casa, Netflix, Aereo..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />

            {/* Quick chips for locations */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COMMON_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocation(loc)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    location === loc
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Campo 3: Voto Personale (Opzionale 1-10) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-200">
                <Star className="w-4 h-4 text-amber-400" />
                Voto Personale <span className="text-[11px] font-normal text-slate-400">(opzionale da 1 a 10)</span>
              </label>

              {rating !== null && (
                <button
                  type="button"
                  onClick={() => setRating(null)}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Rimuovi voto
                </button>
              )}
            </div>

            {/* Interactive Rating Scale 1-10 */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const isSelected = rating === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRating(num)}
                      className={`flex-1 min-w-[32px] h-9 rounded-lg font-bold text-xs flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 scale-105'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>{num}</span>
                    </button>
                  );
                })}
              </div>

              <div className="text-center text-xs font-medium text-amber-400">
                {getRatingLabel(rating)}
              </div>
            </div>
          </div>

          {/* Campo 4: Commenti / Recensione (Opzionale) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-200">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              Commenti & Note Personali <span className="text-[11px] font-normal text-slate-400">(opzionale)</span>
            </label>

            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Cosa ne pensi? Scrivi le tue impressioni, la scena preferita o con chi l'hai guardato..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* Feedback status message */}
          {saveStatus && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                saveStatus.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {saveStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{saveStatus.message}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Annulla
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvataggio in corso...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salva nel Diario</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
