import React, { useState } from 'react';
import { Film, Star } from 'lucide-react';
import { getPosterUrl } from '../services/tmdb';

interface MoviePosterProps {
  posterPath: string | null | undefined;
  backdropPath?: string | null | undefined;
  title: string;
  year?: string | number;
  rating?: number | null;
  size?: 'w185' | 'w342' | 'w500' | 'original';
  className?: string;
  priority?: boolean;
}

export const MoviePoster: React.FC<MoviePosterProps> = ({
  posterPath,
  backdropPath,
  title,
  year,
  rating,
  size = 'w500',
  className = '',
  priority = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [useBackdrop, setUseBackdrop] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Determine which source URL to try
  let targetPath = posterPath;
  if (useBackdrop || !targetPath) {
    targetPath = backdropPath || null;
  }

  const imageUrl = getPosterUrl(targetPath, size);

  const handleImageError = () => {
    if (!useBackdrop && backdropPath && backdropPath !== posterPath) {
      // Try backdrop as secondary source
      setUseBackdrop(true);
    } else {
      // Both poster and backdrop failed or are missing
      setImageError(true);
    }
  };

  // If no image url at all, or image failed to load, render cinema card placeholder
  if (!imageUrl || imageError) {
    return (
      <div
        className={`relative w-full h-full flex flex-col justify-between p-3.5 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-slate-800 text-left overflow-hidden select-none ${className}`}
      >
        {/* Subtle decorative clapperboard stripe top */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500/40 via-amber-400/30 to-amber-600/40" />

        <div className="flex items-center justify-between z-10 pt-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Film className="w-3.5 h-3.5" />
          </div>
          {year && (
            <span className="text-[10px] font-bold text-amber-300 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              {year}
            </span>
          )}
        </div>

        {/* Center decorative cinema reel */}
        <div className="my-auto py-2 z-10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-amber-500/30 flex items-center justify-center text-amber-400/70 mb-2 shadow-inner">
            <Film className="w-6 h-6" />
          </div>
          <p className="text-xs sm:text-sm font-bold text-white line-clamp-3 leading-snug px-1 font-serif">
            {title}
          </p>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/80 z-10">
          <span className="text-slate-500 uppercase tracking-wider font-semibold">CineDiario</span>
          {rating !== undefined && rating !== null && rating > 0 && (
            <span className="flex items-center gap-1 font-bold text-amber-400">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {Number(rating).toFixed(1)}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-slate-950 overflow-hidden ${className}`}>
      {/* Subtle loader skeleton underneath */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center text-slate-700">
          <Film className="w-8 h-8 opacity-40" />
        </div>
      )}

      <img
        src={imageUrl}
        alt={title}
        loading={priority ? 'eager' : 'lazy'}
        crossOrigin="anonymous"
        onLoad={() => setIsLoaded(true)}
        onError={handleImageError}
        className={`w-full h-full object-cover transition-all duration-300 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      />
    </div>
  );
};
