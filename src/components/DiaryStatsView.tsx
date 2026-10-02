import React, { useMemo } from 'react';
import { BarChart3, Star, Film, MapPin, Calendar, Award, Download, TrendingUp, Sparkles } from 'lucide-react';
import { DiaryEntry } from '../types';

interface DiaryStatsViewProps {
  entries: DiaryEntry[];
  onGoToSearch: () => void;
}

export const DiaryStatsView: React.FC<DiaryStatsViewProps> = ({ entries, onGoToSearch }) => {
  const currentYear = new Date().getFullYear().toString();

  const stats = useMemo(() => {
    const total = entries.length;
    let sumRating = 0;
    let ratedCount = 0;
    let thisYearCount = 0;
    const locationMap: Record<string, number> = {};
    const ratingMap: Record<number, number> = { 10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    entries.forEach((e) => {
      // Rating sum
      if (e.rating !== null && e.rating !== undefined && e.rating > 0) {
        sumRating += e.rating;
        ratedCount++;
        const rounded = Math.round(e.rating);
        if (ratingMap[rounded] !== undefined) {
          ratingMap[rounded]++;
        }
      }

      // Year count
      if (e.watch_date && e.watch_date.startsWith(currentYear)) {
        thisYearCount++;
      }

      // Location
      const loc = e.location ? e.location.trim() : 'Non specificato';
      locationMap[loc] = (locationMap[loc] || 0) + 1;
    });

    const averageRating = ratedCount > 0 ? (sumRating / ratedCount).toFixed(1) : null;

    // Sort locations
    const sortedLocations = Object.entries(locationMap).sort((a, b) => b[1] - a[1]);
    const topLocation = sortedLocations.length > 0 ? sortedLocations[0][0] : 'Nessuno';

    return {
      total,
      averageRating,
      ratedCount,
      thisYearCount,
      topLocation,
      sortedLocations,
      ratingMap
    };
  }, [entries, currentYear]);

  // Export to CSV
  const handleExportCSV = () => {
    if (entries.length === 0) return;
    const headers = ['ID', 'Titolo', 'Locandina', 'Data Visione', 'Luogo', 'Voto', 'Commenti', 'Timestamp'];
    const rows = entries.map((e) => [
      `"${e.id}"`,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${e.poster_path || ''}"`,
      `"${e.watch_date || ''}"`,
      `"${(e.location || '').replace(/"/g, '""')}"`,
      `"${e.rating ?? ''}"`,
      `"${(e.comments || '').replace(/"/g, '""')}"`,
      `"${e.timestamp || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cinediario_backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJSON = () => {
    if (entries.length === 0) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cinediario_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-20 px-4 bg-slate-900/30 rounded-2xl border border-slate-800 animate-fadeIn">
        <BarChart3 className="w-16 h-16 text-slate-700 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white font-serif">Nessuna statistica disponibile</h3>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-sm mx-auto">
          Aggiungi film al tuo diario cinematografico per visualizzare grafici, medie voti e luoghi preferiti!
        </p>
        <button
          onClick={onGoToSearch}
          className="mt-6 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm"
        >
          Esplora Film
        </button>
      </div>
    );
  }

  const maxRatingCount = Math.max(...Object.values(stats.ratingMap), 1);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Title & Export */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            Statistiche & Abitudini Cinematografiche
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Analisi del tuo percorso da cinefilo basata sui film salvati.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Esporta CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Esporta JSON</span>
          </button>
        </div>
      </div>

      {/* 4 Key Stat Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Movies */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
            <Film className="w-4 h-4" />
          </div>
          <p className="text-xs font-medium text-slate-400">Film Visti Totali</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-serif">
            {stats.total}
          </p>
        </div>

        {/* Average Rating */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
            <Star className="w-4 h-4 fill-amber-400" />
          </div>
          <p className="text-xs font-medium text-slate-400">Media Voti Assegnati</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1 font-serif">
            {stats.averageRating ? `${stats.averageRating} / 10` : 'N/D'}
          </p>
        </div>

        {/* This Year */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-2">
            <Calendar className="w-4 h-4" />
          </div>
          <p className="text-xs font-medium text-slate-400">Visti nel {currentYear}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-serif">
            {stats.thisYearCount}
          </p>
        </div>

        {/* Top Venue */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
            <MapPin className="w-4 h-4" />
          </div>
          <p className="text-xs font-medium text-slate-400">Luogo Preferito</p>
          <p className="text-sm sm:text-base font-bold text-white mt-2 truncate font-serif">
            {stats.topLocation}
          </p>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rating Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Distribuzione dei Voti (1-10)
          </h3>

          <div className="space-y-2">
            {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((val) => {
              const count = stats.ratingMap[val] || 0;
              const percent = ((count / maxRatingCount) * 100).toFixed(0);

              return (
                <div key={val} className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-mono font-bold text-slate-300">
                    ★ {val}
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        val >= 9 ? 'bg-amber-400' : val >= 7 ? 'bg-amber-500' : 'bg-slate-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-slate-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Locations Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            Luoghi di Visione
          </h3>

          <div className="space-y-3">
            {stats.sortedLocations.slice(0, 6).map(([loc, count]) => {
              const pct = ((count / stats.total) * 100).toFixed(0);
              return (
                <div key={loc} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium truncate">{loc}</span>
                    <span className="text-slate-400 font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
