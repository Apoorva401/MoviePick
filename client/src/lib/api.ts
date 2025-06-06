import { apiRequest } from './queryClient';
import { Movie, Genre, UserRating, UserWatchlistItem, UserPreferences, UserPlaylist, PlaylistItem, EnhancedPlaylistItem } from '@shared/schema';

// Image URL helpers for local dataset
export const getPosterUrl = (path: string | null, size: string = 'w500'): string => {
  if (!path) return '/placeholder-poster.svg';
  // If it's already a full URL, return it as is
  if (path.startsWith('http')) {
    return path;
  }
  return '/placeholder-poster.svg';
};

export const getBackdropUrl = (path: string | null, size: string = 'original'): string => {
  if (!path) return '/placeholder-backdrop.svg';
  // If it's already a full URL, return it as is
  if (path && path.startsWith('http')) {
    return path;
  }
  return '/placeholder-backdrop.svg';
};

// Auth APIs
export const login = async (username: string, password: string) => {
  const res = await apiRequest('POST', '/api/auth/login', { username, password });
  return res.json();
};

export const register = async (username: string, password: string, name?: string) => {
  const res = await apiRequest('POST', '/api/auth/register', { username, password, name });
  return res.json();
};

export const logout = async () => {
  const res = await apiRequest('POST', '/api/auth/logout', {});
  return res.json();
};

export const forgotPassword = async (username: string, email: string) => {
  const res = await apiRequest('POST', '/api/auth/forgot-password', { username, email });
  return res.json();
};

export const resetPassword = async (token: string, newPassword: string) => {
  const res = await apiRequest('POST', '/api/auth/reset-password', { token, newPassword });
  return res.json();
};

export const getCurrentUser = async () => {
  const res = await apiRequest('GET', '/api/auth/me', undefined);
  return res.json();
};

// Movie APIs
export const getPopularMovies = async (page: number = 1) => {
  const res = await apiRequest('GET', `/api/movies/popular?page=${page}`, undefined);
  return res.json();
};

export const getTopRatedMovies = async (page: number = 1) => {
  const res = await apiRequest('GET', `/api/movies/top-rated?page=${page}`, undefined);
  return res.json();
};

export const searchMovies = async (query: string, page: number = 1) => {
  const res = await apiRequest('GET', `/api/movies/search?query=${encodeURIComponent(query)}&page=${page}`, undefined);
  return res.json();
};

export const getMoviesByGenre = async (genreId: number, page: number = 1) => {
  const res = await apiRequest('GET', `/api/movies/by-genre/${genreId}?page=${page}`, undefined);
  return res.json();
};

export const getMovieDetails = async (movieId: number) => {
  const res = await apiRequest('GET', `/api/movies/${movieId}`, undefined);
  return res.json();
};

export const getSimilarMovies = async (movieId: number) => {
  const res = await apiRequest('GET', `/api/movies/${movieId}/similar`, undefined);
  return res.json();
};

// Genre APIs
export const getGenres = async (): Promise<Genre[]> => {
  const res = await apiRequest('GET', '/api/genres', undefined);
  return res.json();
};

// User Preferences APIs
export const getUserPreferences = async (): Promise<UserPreferences> => {
  const res = await apiRequest('GET', '/api/user/preferences', undefined);
  return res.json();
};

export const updateUserPreferences = async (preferences: {
  genreIds?: number[];
  actorIds?: number[];
  directorIds?: number[];
}): Promise<UserPreferences> => {
  const res = await apiRequest('POST', '/api/user/preferences', preferences);
  return res.json();
};

// User Ratings APIs
export const getUserRatings = async (): Promise<UserRating[]> => {
  const res = await apiRequest('GET', '/api/user/ratings', undefined);
  return res.json();
};

export const getUserRatingForMovie = async (movieId: number): Promise<UserRating | null> => {
  try {
    const res = await apiRequest('GET', `/api/user/ratings/${movieId}`, undefined);
    return res.json();
  } catch (error) {
    return null;
  }
};

export const rateMovie = async (movieId: number, rating: number): Promise<UserRating> => {
  const res = await apiRequest('POST', '/api/user/ratings', { movieId, rating });
  return res.json();
};

// User Watchlist APIs
export const getUserWatchlist = async (): Promise<UserWatchlistItem[]> => {
  const res = await apiRequest('GET', '/api/user/watchlist', undefined);
  return res.json();
};

export const checkIfMovieInWatchlist = async (movieId: number): Promise<boolean> => {
  try {
    const res = await apiRequest('GET', `/api/user/watchlist/check/${movieId}`, undefined);
    const data = await res.json();
    return data.isInWatchlist;
  } catch (error) {
    return false;
  }
};

export const addToWatchlist = async (movieId: number): Promise<UserWatchlistItem> => {
  const res = await apiRequest('POST', '/api/user/watchlist', { movieId });
  return res.json();
};

export const removeFromWatchlist = async (movieId: number): Promise<void> => {
  await apiRequest('DELETE', `/api/user/watchlist/${movieId}`, undefined);
};

// Recommendations API
export const getRecommendations = async (page: number = 1): Promise<Movie[]> => {
  const res = await apiRequest('GET', `/api/user/recommendations?page=${page}`, undefined);
  return res.json();
};

// Playlist APIs
export const getUserPlaylists = async (): Promise<UserPlaylist[]> => {
  const res = await apiRequest('GET', '/api/playlists', undefined);
  return res.json();
};

export const getPublicPlaylists = async (): Promise<UserPlaylist[]> => {
  const res = await apiRequest('GET', '/api/playlists/public', undefined);
  return res.json();
};

export const getPlaylist = async (playlistId: number): Promise<UserPlaylist> => {
  const res = await apiRequest('GET', `/api/playlists/${playlistId}`, undefined);
  return res.json();
};

export const createPlaylist = async (playlist: {
  name: string;
  description?: string;
  isPublic: boolean;
}): Promise<UserPlaylist> => {
  const res = await apiRequest('POST', '/api/playlists', playlist);
  return res.json();
};

export const updatePlaylist = async (
  playlistId: number,
  updates: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  }
): Promise<UserPlaylist> => {
  const res = await apiRequest('PUT', `/api/playlists/${playlistId}`, updates);
  return res.json();
};

export const deletePlaylist = async (playlistId: number): Promise<void> => {
  await apiRequest('DELETE', `/api/playlists/${playlistId}`, undefined);
};

export const getPlaylistItems = async (playlistId: number): Promise<EnhancedPlaylistItem[]> => {
  const res = await apiRequest('GET', `/api/playlists/${playlistId}/items`, undefined);
  return res.json();
};

export const addMovieToPlaylist = async (
  playlistId: number,
  movieId: number,
  notes?: string
): Promise<PlaylistItem> => {
  const res = await apiRequest('POST', `/api/playlists/${playlistId}/items`, {
    movieId,
    notes,
  });
  return res.json();
};

export const removeMovieFromPlaylist = async (playlistId: number, movieId: number): Promise<void> => {
  await apiRequest('DELETE', `/api/playlists/${playlistId}/items/${movieId}`, undefined);
};

export const updatePlaylistItemNotes = async (
  playlistId: number,
  movieId: number,
  notes: string
): Promise<PlaylistItem> => {
  const res = await apiRequest('PUT', `/api/playlists/${playlistId}/items/${movieId}/notes`, { notes });
  return res.json();
};

export const reorderPlaylistItems = async (playlistId: number, itemIds: number[]): Promise<void> => {
  await apiRequest('PUT', `/api/playlists/${playlistId}/reorder`, { itemIds });
};
