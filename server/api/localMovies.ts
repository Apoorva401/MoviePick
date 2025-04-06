import { readFileSync } from 'fs';
import { join } from 'path';
import { type Movie, type Genre } from "@shared/schema";

// Extract genres and assign IDs
const genreMap = new Map<string, number>();
let genreIdCounter = 1;

function getGenreId(genreName: string): number {
  if (!genreMap.has(genreName)) {
    genreMap.set(genreName, genreIdCounter++);
  }
  return genreMap.get(genreName) || 0;
}

// Read the movie dataset
const moviesData = JSON.parse(readFileSync(join(process.cwd(), 'data', 'movies.json'), 'utf-8'));

// Add IDs and transform to match our schema
const moviesWithIds: Movie[] = moviesData.map((movie: any, index: number) => {
  // Handle missing genres
  const genres = movie.genres || [];
  
  return {
    id: index + 1,
    title: movie.title,
    overview: movie.extract || '',
    poster_path: movie.thumbnail || null,
    backdrop_path: null,
    release_date: `${movie.year}-01-01`,
    vote_average: Math.random() * 10, // Random rating between 0-10
    vote_count: Math.floor(Math.random() * 1000), // Random vote count
    popularity: Math.random() * 100, // Random popularity score
    genre_ids: genres.map((genreName: string) => getGenreId(genreName)),
    adult: false,
    runtime: Math.floor(Math.random() * 60) + 60, // Random runtime between 60-120 minutes
    genres: genres.map((genreName: string, idx: number) => ({
      id: getGenreId(genreName),
      name: genreName
    })),
    videos: {
      results: []
    },
    credits: {
      cast: movie.cast ? movie.cast.map((name: string, idx: number) => ({
        id: idx + 1,
        name,
        character: `Character ${idx + 1}`,
        profile_path: null
      })) : [],
      crew: []
    }
  };
});

// Filter out movies without titles or years
const validMovies = moviesWithIds.filter(movie => 
  movie.title && movie.release_date && movie.poster_path
);

// Create genre list
const genres: Genre[] = Array.from(genreMap.entries()).map(([name, id]) => ({
  id,
  name
}));

// Get all genres
export async function fetchGenres(): Promise<Genre[]> {
  return genres;
}

// Get popular movies
export async function fetchPopularMovies(page = 1): Promise<Movie[]> {
  const pageSize = 20;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  // Sort by "popularity" for this endpoint
  const sortedMovies = [...validMovies].sort((a, b) => b.popularity - a.popularity);
  
  return sortedMovies.slice(startIndex, endIndex);
}

// Get top rated movies
export async function fetchTopRatedMovies(page = 1): Promise<Movie[]> {
  const pageSize = 20;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  // Sort by vote_average for this endpoint
  const sortedMovies = [...validMovies].sort((a, b) => b.vote_average - a.vote_average);
  
  return sortedMovies.slice(startIndex, endIndex);
}

// Get movie details
export async function fetchMovieDetails(movieId: number): Promise<Movie | null> {
  const movie = validMovies.find(m => m.id === movieId);
  return movie || null;
}

// Search movies
export async function searchMovies(query: string, page = 1): Promise<Movie[]> {
  if (!query.trim()) return [];
  
  const pageSize = 20;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  const searchResults = validMovies.filter(movie => 
    movie.title.toLowerCase().includes(query.toLowerCase()) ||
    (movie.overview && movie.overview.toLowerCase().includes(query.toLowerCase()))
  );
  
  return searchResults.slice(startIndex, endIndex);
}

// Get movies by genre
export async function fetchMoviesByGenre(genreId: number, page = 1): Promise<Movie[]> {
  const pageSize = 20;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  const genreMovies = validMovies.filter(movie => 
    movie.genre_ids.includes(genreId)
  );
  
  return genreMovies.slice(startIndex, endIndex);
}

// Get similar movies
export async function fetchSimilarMovies(movieId: number): Promise<Movie[]> {
  const movie = validMovies.find(m => m.id === movieId);
  if (!movie) return [];
  
  // Find movies with similar genres
  const similarMovies = validMovies
    .filter(m => m.id !== movieId && m.genre_ids.some(genreId => movie.genre_ids.includes(genreId)))
    .sort((a, b) => {
      // Count how many genres match
      const aMatches = a.genre_ids.filter(genreId => movie.genre_ids.includes(genreId)).length;
      const bMatches = b.genre_ids.filter(genreId => movie.genre_ids.includes(genreId)).length;
      return bMatches - aMatches;
    });
  
  return similarMovies.slice(0, 20);
}

// Get recommendations
export async function fetchRecommendations(
  genreIds: number[] = [], 
  excludeMovieIds: number[] = [], 
  page = 1
): Promise<Movie[]> {
  const pageSize = 20;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  let recommendedMovies = validMovies;
  
  // Filter by genres if specified
  if (genreIds.length > 0) {
    recommendedMovies = recommendedMovies.filter(movie => 
      movie.genre_ids.some(genreId => genreIds.includes(genreId))
    );
  }
  
  // Exclude movies
  if (excludeMovieIds.length > 0) {
    recommendedMovies = recommendedMovies.filter(movie => 
      !excludeMovieIds.includes(movie.id)
    );
  }
  
  // Sort by popularity
  recommendedMovies.sort((a, b) => b.popularity - a.popularity);
  
  return recommendedMovies.slice(startIndex, endIndex);
}

// Get image URL
export function getImageUrl(path: string | null, size: string = "w500"): string {
  if (!path) {
    return size.includes('backdrop') ? '/placeholder-backdrop.svg' : '/placeholder-poster.svg';
  }
  
  // If it's already a full URL, return it
  if (path.startsWith('http')) {
    return path;
  }
  
  // For paths that might be relative
  return path.startsWith('/') ? path : `/${path}`;
}