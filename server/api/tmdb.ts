import { type Movie, type Genre } from "@shared/schema";

const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

if (!TMDB_API_KEY) {
  console.warn("TMDB_API_KEY is not set. API requests will fail.");
}

const headers = {
  Authorization: `Bearer ${TMDB_API_KEY}`,
  "Content-Type": "application/json",
};

// Fetch genres from TMDB API
export async function fetchGenres(): Promise<Genre[]> {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/genre/movie/list`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch genres: ${response.status}`);
    }

    const data = await response.json();
    return data.genres;
  } catch (error) {
    console.error("Error fetching genres:", error);
    return [];
  }
}

// Fetch popular movies from TMDB API
export async function fetchPopularMovies(page = 1): Promise<Movie[]> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/popular?page=${page}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch popular movies: ${response.status}`);
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    return [];
  }
}

// Fetch top rated movies from TMDB API
export async function fetchTopRatedMovies(page = 1): Promise<Movie[]> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/top_rated?page=${page}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch top rated movies: ${response.status}`);
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching top rated movies:", error);
    return [];
  }
}

// Fetch movie details from TMDB API
export async function fetchMovieDetails(movieId: number): Promise<Movie | null> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}?append_to_response=videos,credits`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch movie details: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching movie details for ${movieId}:`, error);
    return null;
  }
}

// Search movies from TMDB API
export async function searchMovies(query: string, page = 1): Promise<Movie[]> {
  try {
    if (!query.trim()) {
      return [];
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${page}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to search movies: ${response.status}`);
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error searching movies:", error);
    return [];
  }
}

// Fetch movies by genre from TMDB API
export async function fetchMoviesByGenre(genreId: number, page = 1): Promise<Movie[]> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/discover/movie?with_genres=${genreId}&page=${page}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch movies by genre: ${response.status}`);
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error(`Error fetching movies by genre ${genreId}:`, error);
    return [];
  }
}

// Fetch similar movies from TMDB API
export async function fetchSimilarMovies(movieId: number): Promise<Movie[]> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}/similar`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch similar movies: ${response.status}`);
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error(`Error fetching similar movies for ${movieId}:`, error);
    return [];
  }
}

// Fetch recommended movies based on user preferences
export async function fetchRecommendations(
  genreIds: number[] = [], 
  excludeMovieIds: number[] = [], 
  page = 1
): Promise<Movie[]> {
  try {
    let url = `${TMDB_BASE_URL}/discover/movie?page=${page}&sort_by=popularity.desc`;
    
    if (genreIds.length > 0) {
      url += `&with_genres=${genreIds.join(',')}`;
    }
    
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch recommendations: ${response.status}`);
    }

    const data = await response.json();
    return data.results.filter((movie: Movie) => !excludeMovieIds.includes(movie.id));
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
}

// Get the image URL for a poster or backdrop
export function getImageUrl(path: string | null, size: string = "w500"): string {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
