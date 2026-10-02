export interface TMDBMovie {
  id: number;
  title: string;
  original_title?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  overview?: string;
  genre_ids?: number[];
  popularity?: number;
}

export interface DiaryEntry {
  id: string; // TMDB movie id or custom unique string
  title: string;
  poster_path: string;
  watch_date: string; // YYYY-MM-DD or empty
  location: string; // e.g. Cinema, Casa, Netflix, ecc.
  rating: number | null; // 1 to 10 or null
  comments: string; // user review / personal notes
  timestamp: string; // ISO date string
  
  // Optional cached TMDB metadata
  original_title?: string;
  release_year?: string;
  overview?: string;
}

export interface AppSettings {
  gasWebAppUrl: string;
  tmdbApiKey: string;
  offlineModeOnly: boolean;
}

export interface DiaryStats {
  totalMovies: number;
  averageRating: number | null;
  ratedCount: number;
  thisYearCount: number;
  topLocation: string;
  locationCounts: Record<string, number>;
  ratingDistribution: Record<number, number>;
}
