import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertUserPreferencesSchema,
  insertUserRatingSchema,
  insertUserWatchlistSchema,
  insertGenreSchema,
  insertUserPlaylistSchema,
  insertPlaylistItemSchema,
} from "@shared/schema";
import * as movieApi from "./api/localMovies";

// Middleware to check if user is authenticated
function requireAuth(req: Request, res: Response, next: NextFunction) {
  // For simplicity, we're using a simple session-based approach
  // In a real app, you'd use a proper auth system
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize genres from local movie data
  const initGenres = async () => {
    try {
      const genres = await movieApi.fetchGenres();
      for (const genre of genres) {
        await storage.createGenre(genre);
      }
      console.log(`Initialized ${genres.length} genres`);
    } catch (error) {
      console.error("Failed to initialize genres:", error);
    }
  };
  
  // Initialize genres on startup
  initGenres();

  // Auth routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        console.log(`User not found: ${username}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Simple password comparison (in a real app, we'd use bcrypt)
      if (user.password !== password) {
        console.log(`Password mismatch for user: ${username}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      req.session.userId = user.id;
      console.log(`User logged in: ${username} (ID: ${user.id})`);
      
      return res.json({ 
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid user data", errors: result.error });
      }
      
      const existingUser = await storage.getUserByUsername(result.data.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(result.data);
      
      // Save user ID in session
      req.session.userId = user.id;
      console.log(`User registered: ${user.username} (ID: ${user.id})`);
      
      return res.status(201).json({ 
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy((err: Error | null) => {
        if (err) {
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.clearCookie("connect.sid");
        return res.json({ message: "Logged out successfully" });
      });
    } else {
      return res.json({ message: "Already logged out" });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json({ 
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar
      });
    } catch (error) {
      console.error("Get current user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Password reset - request a reset token
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { username, email } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      const token = await storage.generateResetToken(username);
      
      if (!token) {
        // Don't reveal if user exists
        return res.status(200).json({ 
          message: "If an account with that username exists, a password reset link has been sent." 
        });
      }
      
      // Import the SendGrid utility
      const { sendPasswordResetEmail } = await import('./utils/sendgrid');
      
      // Try to send email if we have an API key and email was provided
      let emailSent = false;
      
      if (process.env.SENDGRID_API_KEY && email) {
        emailSent = await sendPasswordResetEmail(email, token, username);
      }
      
      // Return the token directly if email wasn't sent
      if (!emailSent) {
        return res.status(200).json({ 
          message: "Password reset initiated",
          resetToken: token,
          note: "Email service not configured. Use this token to reset your password."
        });
      } else {
        return res.status(200).json({ 
          message: "A password reset link has been sent to your email."
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      return res.status(500).json({ message: "An error occurred processing your request" });
    }
  });
  
  // Password reset - verify token and update password
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      
      const user = await storage.getUserByResetToken(token);
      
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Update the user's password
      const updatedUser = await storage.updatePassword(user.id, newPassword);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      return res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      return res.status(500).json({ message: "An error occurred resetting your password" });
    }
  });

  // Movie and genre routes
  app.get("/api/genres", async (_req: Request, res: Response) => {
    try {
      const genres = await storage.getGenres();
      return res.json(genres);
    } catch (error) {
      console.error("Get genres error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/movies/popular", async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const movies = await movieApi.fetchPopularMovies(page);
      return res.json(movies);
    } catch (error) {
      console.error("Get popular movies error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/movies/top-rated", async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const movies = await movieApi.fetchTopRatedMovies(page);
      return res.json(movies);
    } catch (error) {
      console.error("Get top rated movies error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/movies/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.query as string;
      const page = parseInt(req.query.page as string) || 1;
      
      if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      
      const movies = await movieApi.searchMovies(query, page);
      return res.json(movies);
    } catch (error) {
      console.error("Search movies error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/movies/by-genre/:genreId", async (req: Request, res: Response) => {
    try {
      const genreId = parseInt(req.params.genreId);
      const page = parseInt(req.query.page as string) || 1;
      
      if (isNaN(genreId)) {
        return res.status(400).json({ message: "Invalid genre ID" });
      }
      
      const movies = await movieApi.fetchMoviesByGenre(genreId, page);
      return res.json(movies);
    } catch (error) {
      console.error("Get movies by genre error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/movies/:id", async (req: Request, res: Response) => {
    try {
      const movieId = parseInt(req.params.id);
      
      if (isNaN(movieId)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      
      const movie = await movieApi.fetchMovieDetails(movieId);
      
      if (!movie) {
        return res.status(404).json({ message: "Movie not found" });
      }
      
      return res.json(movie);
    } catch (error) {
      console.error("Get movie details error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/movies/:id/similar", async (req: Request, res: Response) => {
    try {
      const movieId = parseInt(req.params.id);
      
      if (isNaN(movieId)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      
      const movies = await movieApi.fetchSimilarMovies(movieId);
      return res.json(movies);
    } catch (error) {
      console.error("Get similar movies error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // User preferences routes
  app.get("/api/user/preferences", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        return res.json({ genreIds: [], actorIds: [], directorIds: [] });
      }
      
      return res.json(preferences);
    } catch (error) {
      console.error("Get user preferences error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/user/preferences", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      
      const preferencesData = {
        ...req.body,
        userId,
      };
      
      const result = insertUserPreferencesSchema.safeParse(preferencesData);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid preferences data", errors: result.error });
      }
      
      const preferences = await storage.createOrUpdateUserPreferences(result.data);
      return res.json(preferences);
    } catch (error) {
      console.error("Update user preferences error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // User ratings routes
  app.get("/api/user/ratings", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const ratings = await storage.getUserRatings(userId);
      return res.json(ratings);
    } catch (error) {
      console.error("Get user ratings error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user/ratings/:movieId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const movieId = parseInt(req.params.movieId);
      
      if (isNaN(movieId)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      
      const rating = await storage.getUserRatingForMovie(userId, movieId);
      
      if (!rating) {
        return res.status(404).json({ message: "Rating not found" });
      }
      
      return res.json(rating);
    } catch (error) {
      console.error("Get user rating for movie error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/user/ratings", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      
      const ratingData = {
        ...req.body,
        userId,
      };
      
      const result = insertUserRatingSchema.safeParse(ratingData);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid rating data", errors: result.error });
      }
      
      const rating = await storage.createOrUpdateUserRating(result.data);
      return res.json(rating);
    } catch (error) {
      console.error("Create/update user rating error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // User watchlist routes
  app.get("/api/user/watchlist", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const watchlist = await storage.getUserWatchlist(userId);
      return res.json(watchlist);
    } catch (error) {
      console.error("Get user watchlist error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user/watchlist/check/:movieId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const movieId = parseInt(req.params.movieId);
      
      if (isNaN(movieId)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      
      const isInWatchlist = await storage.isMovieInWatchlist(userId, movieId);
      return res.json({ isInWatchlist });
    } catch (error) {
      console.error("Check if movie in watchlist error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/user/watchlist", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      
      const watchlistData = {
        ...req.body,
        userId,
      };
      
      const result = insertUserWatchlistSchema.safeParse(watchlistData);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid watchlist data", errors: result.error });
      }
      
      const watchlistItem = await storage.addToWatchlist(result.data);
      return res.json(watchlistItem);
    } catch (error) {
      console.error("Add to watchlist error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/user/watchlist/:movieId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const movieId = parseInt(req.params.movieId);
      
      if (isNaN(movieId)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      
      await storage.removeFromWatchlist(userId, movieId);
      return res.json({ message: "Movie removed from watchlist" });
    } catch (error) {
      console.error("Remove from watchlist error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Recommendations route
  app.get("/api/user/recommendations", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const page = parseInt(req.query.page as string) || 1;
      
      // Get user preferences
      const preferences = await storage.getUserPreferences(userId);
      let genreIds: number[] = [];
      
      if (preferences && preferences.genreIds) {
        genreIds = preferences.genreIds as number[];
      }
      
      // Get user ratings to exclude already rated movies
      const ratings = await storage.getUserRatings(userId);
      const ratedMovieIds = ratings.map(rating => rating.movieId);
      
      // Get recommendations based on preferences
      const recommendations = await movieApi.fetchRecommendations(genreIds, ratedMovieIds, page);
      
      return res.json(recommendations);
    } catch (error) {
      console.error("Get recommendations error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Playlist routes
  // Get all playlists for the current user
  app.get("/api/playlists", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const playlists = await storage.getUserPlaylists(userId);
      return res.json(playlists);
    } catch (error) {
      console.error("Get playlists error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get public playlists
  app.get("/api/playlists/public", async (req: Request, res: Response) => {
    try {
      const playlists = await storage.getPublicPlaylists();
      return res.json(playlists);
    } catch (error) {
      console.error("Get public playlists error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get a specific playlist by ID
  app.get("/api/playlists/:id", async (req: Request, res: Response) => {
    try {
      const playlistId = parseInt(req.params.id);
      
      if (isNaN(playlistId)) {
        return res.status(400).json({ message: "Invalid playlist ID" });
      }
      
      const playlist = await storage.getPlaylist(playlistId);
      
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      // If playlist is not public, check if the user is the owner
      if (!playlist.isPublic) {
        if (!req.session || !req.session.userId || req.session.userId !== playlist.userId) {
          return res.status(403).json({ message: "You don't have permission to view this playlist" });
        }
      }
      
      return res.json(playlist);
    } catch (error) {
      console.error("Get playlist error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create a new playlist
  app.post("/api/playlists", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      
      const playlistData = {
        ...req.body,
        userId,
      };
      
      const result = insertUserPlaylistSchema.safeParse(playlistData);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid playlist data", errors: result.error });
      }
      
      const playlist = await storage.createPlaylist(result.data);
      return res.status(201).json(playlist);
    } catch (error) {
      console.error("Create playlist error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update a playlist
  app.put("/api/playlists/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const playlistId = parseInt(req.params.id);
      
      if (isNaN(playlistId)) {
        return res.status(400).json({ message: "Invalid playlist ID" });
      }
      
      // Check if the playlist exists and belongs to the user
      const existingPlaylist = await storage.getPlaylist(playlistId);
      
      if (!existingPlaylist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      if (existingPlaylist.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this playlist" });
      }
      
      // Update the playlist
      const updatedPlaylist = await storage.updatePlaylist(playlistId, req.body);
      return res.json(updatedPlaylist);
    } catch (error) {
      console.error("Update playlist error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete a playlist
  app.delete("/api/playlists/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const playlistId = parseInt(req.params.id);
      
      if (isNaN(playlistId)) {
        return res.status(400).json({ message: "Invalid playlist ID" });
      }
      
      // Check if the playlist exists and belongs to the user
      const existingPlaylist = await storage.getPlaylist(playlistId);
      
      if (!existingPlaylist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      if (existingPlaylist.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this playlist" });
      }
      
      // Delete the playlist
      await storage.deletePlaylist(playlistId);
      return res.json({ message: "Playlist deleted successfully" });
    } catch (error) {
      console.error("Delete playlist error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all items in a playlist
  app.get("/api/playlists/:id/items", async (req: Request, res: Response) => {
    try {
      const playlistId = parseInt(req.params.id);
      
      if (isNaN(playlistId)) {
        return res.status(400).json({ message: "Invalid playlist ID" });
      }
      
      const playlist = await storage.getPlaylist(playlistId);
      
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      // If playlist is not public, check if the user is the owner
      if (!playlist.isPublic) {
        if (!req.session || !req.session.userId || req.session.userId !== playlist.userId) {
          return res.status(403).json({ message: "You don't have permission to view this playlist" });
        }
      }
      
      const items = await storage.getPlaylistItems(playlistId);
      return res.json(items);
    } catch (error) {
      console.error("Get playlist items error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add an item to a playlist
  app.post("/api/playlists/:id/items", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const playlistId = parseInt(req.params.id);
      
      if (isNaN(playlistId)) {
        return res.status(400).json({ message: "Invalid playlist ID" });
      }
      
      // Check if the playlist exists and belongs to the user
      const existingPlaylist = await storage.getPlaylist(playlistId);
      
      if (!existingPlaylist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      if (existingPlaylist.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to modify this playlist" });
      }
      
      const itemData = {
        ...req.body,
        playlistId
      };
      
      const result = insertPlaylistItemSchema.safeParse(itemData);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid playlist item data", errors: result.error });
      }
      
      const item = await storage.addItemToPlaylist(result.data);
      return res.status(201).json(item);
    } catch (error) {
      console.error("Add item to playlist error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Remove an item from a playlist
  app.delete("/api/playlists/:id/items/:movieId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const playlistId = parseInt(req.params.id);
      const movieId = parseInt(req.params.movieId);
      
      if (isNaN(playlistId) || isNaN(movieId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      // Check if the playlist exists and belongs to the user
      const existingPlaylist = await storage.getPlaylist(playlistId);
      
      if (!existingPlaylist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      if (existingPlaylist.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to modify this playlist" });
      }
      
      await storage.removeItemFromPlaylist(playlistId, movieId);
      return res.json({ message: "Item removed from playlist" });
    } catch (error) {
      console.error("Remove item from playlist error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update notes for a playlist item
  app.put("/api/playlists/:id/items/:movieId/notes", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const playlistId = parseInt(req.params.id);
      const movieId = parseInt(req.params.movieId);
      const { notes } = req.body;
      
      if (isNaN(playlistId) || isNaN(movieId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      if (typeof notes !== 'string') {
        return res.status(400).json({ message: "Notes must be a string" });
      }
      
      // Check if the playlist exists and belongs to the user
      const existingPlaylist = await storage.getPlaylist(playlistId);
      
      if (!existingPlaylist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      if (existingPlaylist.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to modify this playlist" });
      }
      
      const updatedItem = await storage.updatePlaylistItemNotes(playlistId, movieId, notes);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Item not found in playlist" });
      }
      
      return res.json(updatedItem);
    } catch (error) {
      console.error("Update playlist item notes error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reorder playlist items
  app.put("/api/playlists/:id/reorder", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const playlistId = parseInt(req.params.id);
      const { itemIds } = req.body;
      
      if (isNaN(playlistId)) {
        return res.status(400).json({ message: "Invalid playlist ID" });
      }
      
      if (!Array.isArray(itemIds)) {
        return res.status(400).json({ message: "itemIds must be an array" });
      }
      
      // Check if the playlist exists and belongs to the user
      const existingPlaylist = await storage.getPlaylist(playlistId);
      
      if (!existingPlaylist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      if (existingPlaylist.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to modify this playlist" });
      }
      
      await storage.reorderPlaylistItems(playlistId, itemIds);
      return res.json({ message: "Playlist items reordered successfully" });
    } catch (error) {
      console.error("Reorder playlist items error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
