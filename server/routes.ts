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
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (req.session) {
        req.session.userId = user.id;
      }
      
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
      
      if (req.session) {
        req.session.userId = user.id;
      }
      
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

  const httpServer = createServer(app);

  return httpServer;
}
