import { TMDBMovie } from '../types';
import { DEFAULT_TMDB_API_KEY } from './storage';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Curated Italian/International cinema collection with verified posters
export const FALLBACK_MOVIES: TMDBMovie[] = [
  {
    id: 872585,
    title: 'Oppenheimer',
    original_title: 'Oppenheimer',
    poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop_path: '/rLb2cw0iwRACKdEUso0od9ziWIK.jpg',
    release_date: '2023-07-19',
    vote_average: 8.1,
    overview: 'La storia del fisico statunitense J. Robert Oppenheimer e del suo ruolo pionieristico nello sviluppo della prima arma nucleare nell\'ambito del Progetto Manhattan.'
  },
  {
    id: 693134,
    title: 'Dune - Parte due',
    original_title: 'Dune: Part Two',
    poster_path: '/czembW0Rk1Ke7ra2NsEtSYeePP3.jpg',
    backdrop_path: '/xOMo8BRK7PfcJv9JCnx7s5200FR.jpg',
    release_date: '2024-02-27',
    vote_average: 8.2,
    overview: 'Paul Atreides si unisce a Chani e ai Fremen mentre trama la vendetta contro i cospiratori che hanno distrutto la sua famiglia.'
  },
  {
    id: 238,
    title: 'Il padrino',
    original_title: 'The Godfather',
    poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    backdrop_path: '/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
    release_date: '1972-03-14',
    vote_average: 8.7,
    overview: 'Spanning from 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family under patriarch Vito Corleone.'
  },
  {
    id: 637,
    title: 'La vita è bella',
    original_title: 'La vita è bella',
    poster_path: '/3e04rLqUj9QnQ3ZfU7cWw1E1e4A.jpg',
    backdrop_path: '/kwUQx8FfT8z53GkLSm6zB44Ydov.jpg',
    release_date: '1997-12-20',
    vote_average: 8.5,
    overview: 'Un cameriere ebreo italiano, Guido Orefice, usa la sua fervida immaginazione e il suo umorismo per proteggere suo figlio dagli orrori di un campo di concentramento nazista.'
  },
  {
    id: 11216,
    title: 'Nuovo Cinema Paradiso',
    original_title: 'Nuovo Cinema Paradiso',
    poster_path: '/8SRUuvB2E199xZ73J8k9VjYh6a1.jpg',
    backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    release_date: '1988-11-17',
    vote_average: 8.5,
    overview: 'Un famoso regista torna al suo paese d\'origine per il funerale del proiezionista del cinema del paese, che gli insegnò ad amare la settima arte.'
  },
  {
    id: 157336,
    title: 'Interstellar',
    original_title: 'Interstellar',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    release_date: '2014-11-05',
    vote_average: 8.4,
    overview: 'Le avventure di un gruppo di esploratori che fanno uso di un buco temporale per superare i limiti dell\'esplorazione spaziale umana.'
  },
  {
    id: 429,
    title: 'Il buono, il brutto, il cattivo',
    original_title: 'Il buono, il brutto, il cattivo',
    poster_path: '/pwhk4VfJdZg6lO41gVvU39ZkZ5g.jpg',
    backdrop_path: '/eoCSp75lxnDc6Vm9UC295CDCPCE.jpg',
    release_date: '1966-12-23',
    vote_average: 8.5,
    overview: 'Durante la guerra di secessione americana, tre avventurieri senza scrupoli sono alla caccia di una cassa piena d\'oro sepolta in un cimitero.'
  },
  {
    id: 278,
    title: 'Le ali della libertà',
    original_title: 'The Shawshank Redemption',
    poster_path: '/9O7gLzmreU0nGkIB6K3BsJbzvNv.jpg',
    backdrop_path: '/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
    release_date: '1994-09-23',
    vote_average: 8.7,
    overview: 'Incarcerato ingiustamente per l\'omicidio della moglie, un bancario coltiva una straordinaria amicizia nel carcere di Shawshank.'
  },
  {
    id: 680,
    title: 'Pulp Fiction',
    original_title: 'Pulp Fiction',
    poster_path: '/plnlrtBUULT0rh3XsjmpubAik09.jpg',
    backdrop_path: '/suaEOtk1916guXlZTjnPP4mgRPx.jpg',
    release_date: '1994-09-10',
    vote_average: 8.5,
    overview: 'Le vite di due sicari della mafia, un pugile, la moglie di un gangster e due rapinatori di tavole calde si intrecciano in quattro storie di violenza e redenzione.'
  },
  {
    id: 155,
    title: 'Il cavaliere oscuro',
    original_title: 'The Dark Knight',
    poster_path: '/1hRoyzDtpgMU7Dz4JF22RANzQ57.jpg',
    backdrop_path: '/hkBaDkMWbLaf8B1rDYRUXk7xHQ2.jpg',
    release_date: '2008-07-16',
    vote_average: 8.5,
    overview: 'Batman combatte la crescente minaccia del Joker, un criminale psicopatico che getta Gotham City nel caos.'
  },
  {
    id: 13,
    title: 'Forrest Gump',
    original_title: 'Forrest Gump',
    poster_path: '/saHP97rTPS5eLmrLQEcANmKrsFl.jpg',
    backdrop_path: '/7c9UVPPiTPltouxShY9fEb9MiNb.jpg',
    release_date: '1994-06-23',
    vote_average: 8.5,
    overview: 'Quarant\'anni di storia americana visti attraverso gli occhi di Forrest Gump, un uomo ingenuo dal cuore d\'oro.'
  },
  {
    id: 98,
    title: 'Il gladiatore',
    original_title: 'Gladiator',
    poster_path: '/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg',
    backdrop_path: '/1nns9eQh9e6E2x80hS85lQ6nL2T.jpg',
    release_date: '2000-05-01',
    vote_average: 8.2,
    overview: 'Un ex generale romano cerca vendetta contro il corrotto imperatore Commodo che ha massacrato la sua famiglia e lo ha ridotto in schiavitù.'
  }
];

export function getPosterUrl(posterPath: string | null | undefined, size: 'w185' | 'w342' | 'w500' | 'original' = 'w500'): string {
  if (!posterPath || typeof posterPath !== 'string') {
    return '';
  }
  const clean = posterPath.trim();
  if (!clean) return '';
  if (clean.startsWith('http')) {
    return clean;
  }
  return `https://image.tmdb.org/t/p/${size}${clean.startsWith('/') ? '' : '/'}${clean}`;
}

function resolveKey(apiKey: string | undefined): string {
  if (!apiKey || apiKey.trim() === '' || apiKey.length < 10) {
    return DEFAULT_TMDB_API_KEY;
  }
  return apiKey.trim();
}

/**
 * 1. Text search endpoint with mandatory language=it-IT parameter
 */
export async function searchMovies(
  query: string,
  apiKey: string,
  page: number = 1
): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
  if (!query || query.trim() === '') {
    return { results: [], total_pages: 0, total_results: 0 };
  }

  const effectiveKey = resolveKey(apiKey);

  try {
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${effectiveKey}&language=it-IT&query=${encodeURIComponent(
      query.trim()
    )}&page=${page}&include_adult=false`;

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      throw new Error(`TMDB error HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid results array');
    }

    // Sort to prioritize films that have complete posters and titles
    const sanitized = data.results.map((m: any) => ({
      ...m,
      poster_path: m.poster_path || m.backdrop_path || null
    }));

    return {
      results: sanitized,
      total_pages: data.total_pages || 1,
      total_results: data.total_results || sanitized.length
    };
  } catch (err) {
    console.warn('TMDB search fetch failed, falling back to local dataset filter:', err);
    const q = query.toLowerCase();
    const filtered = FALLBACK_MOVIES.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.original_title && m.original_title.toLowerCase().includes(q))
    );
    return { results: filtered, total_pages: 1, total_results: filtered.length };
  }
}

/**
 * 2. Year-by-year discover endpoint with mandatory language=it-IT parameter
 */
export async function discoverMoviesByYear(
  year: number | string,
  apiKey: string,
  page: number = 1
): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
  const effectiveKey = resolveKey(apiKey);

  try {
    const url = `${TMDB_BASE_URL}/discover/movie?api_key=${effectiveKey}&language=it-IT&primary_release_year=${year}&sort_by=popularity.desc&page=${page}&include_adult=false`;

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      throw new Error(`TMDB discover HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid results format');
    }

    const sanitized = data.results.map((m: any) => ({
      ...m,
      poster_path: m.poster_path || m.backdrop_path || null
    }));

    return {
      results: sanitized,
      total_pages: data.total_pages || 1,
      total_results: data.total_results || sanitized.length
    };
  } catch (err) {
    console.warn('TMDB discover fetch failed, falling back to local dataset filter:', err);
    const yrStr = String(year);
    const filtered = FALLBACK_MOVIES.filter((m) => m.release_date && m.release_date.startsWith(yrStr));
    return { results: filtered.length > 0 ? filtered : FALLBACK_MOVIES, total_pages: 1, total_results: filtered.length };
  }
}

/**
 * Get detailed movie information by TMDB ID
 */
export async function getMovieDetails(id: number | string, apiKey: string): Promise<TMDBMovie | null> {
  const effectiveKey = resolveKey(apiKey);
  try {
    const url = `${TMDB_BASE_URL}/movie/${id}?api_key=${effectiveKey}&language=it-IT`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return FALLBACK_MOVIES.find((m) => String(m.id) === String(id)) || null;
  }
}

/**
 * Official TMDB Genre Mapping in Italian
 */
export const TMDB_GENRES_MAP: Record<number, string> = {
  28: 'Azione',
  12: 'Avventura',
  16: 'Animazione',
  35: 'Commedia',
  80: 'Crime',
  99: 'Documentario',
  18: 'Dramma',
  10751: 'Famiglia',
  14: 'Fantasy',
  36: 'Storia',
  27: 'Horror',
  10402: 'Musica',
  9648: 'Mistero',
  10749: 'Romance',
  878: 'Fantascienza',
  10770: 'Film TV',
  53: 'Thriller',
  10752: 'Guerra',
  37: 'Western'
};

/**
 * Convert numeric TMDB genre IDs to human-readable Italian genre names
 */
export function getGenreNamesFromIds(ids?: number[]): string[] {
  if (!ids || !Array.isArray(ids)) return [];
  return ids.map((id) => TMDB_GENRES_MAP[id]).filter(Boolean);
}

