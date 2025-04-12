var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/utils/sendgrid.ts
var sendgrid_exports = {};
__export(sendgrid_exports, {
  sendEmail: () => sendEmail,
  sendPasswordResetEmail: () => sendPasswordResetEmail
});
import { MailService } from "@sendgrid/mail";
async function sendEmail(params) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SendGrid API key not set. Email not sent.");
    return false;
  }
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html
    });
    return true;
  } catch (error) {
    console.error("SendGrid email error:", error);
    return false;
  }
}
async function sendPasswordResetEmail(to, resetToken, username) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SendGrid API key not set. Password reset email not sent.");
    return false;
  }
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  const subject = "Password Reset - MoviePick";
  const text2 = `
    Hello ${username},
    
    You requested a password reset for your MoviePick account.
    
    Please use the following link to reset your password:
    ${resetUrl}
    
    This link will expire in 24 hours.
    
    If you did not request this reset, please ignore this email.
    
    Regards,
    The MoviePick Team
  `;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">MoviePick Password Reset</h2>
      <p>Hello ${username},</p>
      <p>You requested a password reset for your MoviePick account.</p>
      <p>Please click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #6366f1;">${resetUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not request this reset, please ignore this email.</p>
      <p>Regards,<br>The MoviePick Team</p>
    </div>
  `;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@moviepick.app";
  return sendEmail({
    to,
    from: fromEmail,
    subject,
    text: text2,
    html
  });
}
var mailService;
var init_sendgrid = __esm({
  "server/utils/sendgrid.ts"() {
    "use strict";
    mailService = new MailService();
    if (process.env.SENDGRID_API_KEY) {
      mailService.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }
});

// server/index.ts
import cors from "cors";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  genres: () => genres,
  insertGenreSchema: () => insertGenreSchema,
  insertPlaylistItemSchema: () => insertPlaylistItemSchema,
  insertUserPlaylistSchema: () => insertUserPlaylistSchema,
  insertUserPreferencesSchema: () => insertUserPreferencesSchema,
  insertUserRatingSchema: () => insertUserRatingSchema,
  insertUserSchema: () => insertUserSchema,
  insertUserWatchlistSchema: () => insertUserWatchlistSchema,
  playlistItems: () => playlistItems,
  userPlaylists: () => userPlaylists,
  userPreferences: () => userPreferences,
  userRatings: () => userRatings,
  userWatchlist: () => userWatchlist,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry")
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  avatar: true
});
var genres = pgTable("genres", {
  id: integer("id").primaryKey(),
  name: text("name").notNull()
});
var insertGenreSchema = createInsertSchema(genres);
var userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  genreIds: json("genre_ids").$type().default([]),
  actorIds: json("actor_ids").$type().default([]),
  directorIds: json("director_ids").$type().default([])
});
var insertUserPreferencesSchema = createInsertSchema(userPreferences).pick({
  userId: true,
  genreIds: true,
  actorIds: true,
  directorIds: true
});
var userRatings = pgTable("user_ratings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  movieId: integer("movie_id").notNull(),
  rating: integer("rating").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserRatingSchema = createInsertSchema(userRatings).pick({
  userId: true,
  movieId: true,
  rating: true
});
var userWatchlist = pgTable("user_watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  movieId: integer("movie_id").notNull(),
  addedAt: timestamp("added_at").defaultNow()
});
var insertUserWatchlistSchema = createInsertSchema(userWatchlist).pick({
  userId: true,
  movieId: true
});
var userPlaylists = pgTable("user_playlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertUserPlaylistSchema = createInsertSchema(userPlaylists).pick({
  userId: true,
  name: true,
  description: true,
  isPublic: true
});
var playlistItems = pgTable("playlist_items", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").notNull().references(() => userPlaylists.id),
  movieId: integer("movie_id").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
  sortOrder: integer("sort_order").default(0),
  notes: text("notes")
});
var insertPlaylistItemSchema = createInsertSchema(playlistItems).pick({
  playlistId: true,
  movieId: true,
  sortOrder: true,
  notes: true
});

// server/storage.ts
import session from "express-session";
import createMemoryStore from "memorystore";
import { eq, and } from "drizzle-orm";

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import "dotenv/config";
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}
var pg = await import("pg");
var pool = new pg.default.Pool({
  connectionString: process.env.DATABASE_URL
});
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
var DatabaseStorage = class {
  sessionStore;
  constructor() {
  }
  // User Playlist methods
  async getUserPlaylists(userId) {
    return db.select().from(userPlaylists).where(eq(userPlaylists.userId, userId));
  }
  async getPlaylist(playlistId) {
    const [playlist] = await db.select().from(userPlaylists).where(eq(userPlaylists.id, playlistId));
    return playlist;
  }
  async getPublicPlaylists() {
    return db.select().from(userPlaylists).where(eq(userPlaylists.isPublic, true));
  }
  async createPlaylist(playlist) {
    const now = /* @__PURE__ */ new Date();
    const [newPlaylist] = await db.insert(userPlaylists).values({
      ...playlist,
      createdAt: now,
      updatedAt: now
    }).returning();
    return newPlaylist;
  }
  async updatePlaylist(playlistId, updates) {
    const [updatedPlaylist] = await db.update(userPlaylists).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(userPlaylists.id, playlistId)).returning();
    return updatedPlaylist;
  }
  async deletePlaylist(playlistId) {
    await db.delete(playlistItems).where(eq(playlistItems.playlistId, playlistId));
    await db.delete(userPlaylists).where(eq(userPlaylists.id, playlistId));
  }
  // Playlist Item methods
  async getPlaylistItems(playlistId) {
    return db.select().from(playlistItems).where(eq(playlistItems.playlistId, playlistId)).orderBy(playlistItems.sortOrder);
  }
  async addItemToPlaylist(item) {
    const items = await this.getPlaylistItems(item.playlistId);
    const maxSortOrder = items.length > 0 ? Math.max(...items.map((i) => i.sortOrder || 0)) : -1;
    const [newItem] = await db.insert(playlistItems).values({
      ...item,
      sortOrder: item.sortOrder !== void 0 ? item.sortOrder : maxSortOrder + 1,
      addedAt: /* @__PURE__ */ new Date()
    }).returning();
    return newItem;
  }
  async removeItemFromPlaylist(playlistId, movieId) {
    await db.delete(playlistItems).where(
      and(
        eq(playlistItems.playlistId, playlistId),
        eq(playlistItems.movieId, movieId)
      )
    );
  }
  async updatePlaylistItemNotes(playlistId, movieId, notes) {
    const [updatedItem] = await db.update(playlistItems).set({ notes }).where(
      and(
        eq(playlistItems.playlistId, playlistId),
        eq(playlistItems.movieId, movieId)
      )
    ).returning();
    return updatedItem;
  }
  async reorderPlaylistItems(playlistId, itemIds) {
    for (let i = 0; i < itemIds.length; i++) {
      await db.update(playlistItems).set({ sortOrder: i }).where(
        and(
          eq(playlistItems.id, itemIds[i]),
          eq(playlistItems.playlistId, playlistId)
        )
      );
    }
  }
  // User methods
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values({
      username: insertUser.username,
      password: insertUser.password,
      name: insertUser.name || null,
      avatar: insertUser.avatar || null,
      createdAt: /* @__PURE__ */ new Date(),
      resetToken: null,
      resetTokenExpiry: null
    }).returning();
    return user;
  }
  // Password Reset methods
  async getUserByResetToken(token) {
    const now = /* @__PURE__ */ new Date();
    const [user] = await db.select().from(users).where(
      and(
        eq(users.resetToken, token),
        // Check if resetTokenExpiry exists and is greater than now
        // Drizzle handles the date comparison properly
        // @ts-ignore
        users.resetTokenExpiry.gt(now)
      )
    );
    return user;
  }
  async generateResetToken(username) {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiry = /* @__PURE__ */ new Date();
    expiry.setHours(expiry.getHours() + 24);
    await db.update(users).set({
      resetToken: token,
      resetTokenExpiry: expiry
    }).where(eq(users.id, user.id));
    return token;
  }
  async updatePassword(userId, newPassword) {
    const [updatedUser] = await db.update(users).set({
      password: newPassword,
      resetToken: null,
      resetTokenExpiry: null
    }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }
  // Genre methods
  async getGenres() {
    return db.select().from(genres);
  }
  async getGenre(id) {
    const [genre] = await db.select().from(genres).where(eq(genres.id, id));
    return genre;
  }
  async createGenre(genre) {
    const [newGenre] = await db.insert(genres).values(genre).onConflictDoUpdate({
      target: genres.id,
      set: { name: genre.name }
    }).returning();
    return newGenre;
  }
  // User Preferences methods
  async getUserPreferences(userId) {
    const [preferences] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return preferences;
  }
  async createOrUpdateUserPreferences(preferences) {
    const existingPreferences = await this.getUserPreferences(preferences.userId);
    if (existingPreferences) {
      const [updatedPreferences] = await db.update(userPreferences).set({
        genreIds: preferences.genreIds,
        actorIds: preferences.actorIds,
        directorIds: preferences.directorIds
      }).where(eq(userPreferences.id, existingPreferences.id)).returning();
      return updatedPreferences;
    } else {
      const [newPreferences] = await db.insert(userPreferences).values(preferences).returning();
      return newPreferences;
    }
  }
  // User Ratings methods
  async getUserRatings(userId) {
    return db.select().from(userRatings).where(eq(userRatings.userId, userId));
  }
  async getUserRatingForMovie(userId, movieId) {
    const [rating] = await db.select().from(userRatings).where(
      and(
        eq(userRatings.userId, userId),
        eq(userRatings.movieId, movieId)
      )
    );
    return rating;
  }
  async createOrUpdateUserRating(rating) {
    const existingRating = await this.getUserRatingForMovie(rating.userId, rating.movieId);
    if (existingRating) {
      const [updatedRating] = await db.update(userRatings).set({ rating: rating.rating }).where(eq(userRatings.id, existingRating.id)).returning();
      return updatedRating;
    } else {
      const [newRating] = await db.insert(userRatings).values({
        ...rating,
        createdAt: /* @__PURE__ */ new Date()
      }).returning();
      return newRating;
    }
  }
  // User Watchlist methods
  async getUserWatchlist(userId) {
    return db.select().from(userWatchlist).where(eq(userWatchlist.userId, userId));
  }
  async isMovieInWatchlist(userId, movieId) {
    const [item] = await db.select().from(userWatchlist).where(
      and(
        eq(userWatchlist.userId, userId),
        eq(userWatchlist.movieId, movieId)
      )
    );
    return !!item;
  }
  async addToWatchlist(watchlistItem) {
    const isInWatchlist = await this.isMovieInWatchlist(watchlistItem.userId, watchlistItem.movieId);
    if (!isInWatchlist) {
      const [newItem] = await db.insert(userWatchlist).values({
        ...watchlistItem,
        addedAt: /* @__PURE__ */ new Date()
      }).returning();
      return newItem;
    } else {
      const [existingItem] = await db.select().from(userWatchlist).where(
        and(
          eq(userWatchlist.userId, watchlistItem.userId),
          eq(userWatchlist.movieId, watchlistItem.movieId)
        )
      );
      return existingItem;
    }
  }
  async removeFromWatchlist(userId, movieId) {
    await db.delete(userWatchlist).where(
      and(
        eq(userWatchlist.userId, userId),
        eq(userWatchlist.movieId, movieId)
      )
    );
  }
};
var storage = new DatabaseStorage();

// server/api/localMovies.ts
import { readFileSync } from "fs";
import { join } from "path";
var genreMap = /* @__PURE__ */ new Map();
var genreIdCounter = 1;
function getGenreId(genreName) {
  if (!genreMap.has(genreName)) {
    genreMap.set(genreName, genreIdCounter++);
  }
  return genreMap.get(genreName) || 0;
}
var moviesData = JSON.parse(readFileSync(join(process.cwd(), "data", "movies.json"), "utf-8"));
var moviesWithIds = moviesData.map((movie, index) => {
  const genres3 = movie.genres || [];
  return {
    id: index + 1,
    title: movie.title,
    overview: movie.extract || "",
    poster_path: movie.thumbnail || null,
    backdrop_path: null,
    release_date: `${movie.year}-01-01`,
    vote_average: Math.random() * 10,
    // Random rating between 0-10
    vote_count: Math.floor(Math.random() * 1e3),
    // Random vote count
    popularity: Math.random() * 100,
    // Random popularity score
    genre_ids: genres3.map((genreName) => getGenreId(genreName)),
    adult: false,
    runtime: Math.floor(Math.random() * 60) + 60,
    // Random runtime between 60-120 minutes
    genres: genres3.map((genreName, idx) => ({
      id: getGenreId(genreName),
      name: genreName
    })),
    videos: {
      results: []
    },
    credits: {
      cast: movie.cast ? movie.cast.map((name, idx) => ({
        id: idx + 1,
        name,
        character: `Character ${idx + 1}`,
        profile_path: null
      })) : [],
      crew: []
    }
  };
});
var validMovies = moviesWithIds.filter(
  (movie) => movie.title && movie.release_date && movie.poster_path
);
var genres2 = Array.from(genreMap.entries()).map(([name, id]) => ({
  id,
  name
}));
async function fetchGenres() {
  return genres2;
}
async function fetchPopularMovies(page = 1) {
  const pageSize = 20;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const sortedMovies = [...validMovies].sort((a, b) => b.popularity - a.popularity);
  return sortedMovies.slice(startIndex, endIndex);
}
async function fetchTopRatedMovies(page = 1) {
  const pageSize = 20;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const sortedMovies = [...validMovies].sort((a, b) => b.vote_average - a.vote_average);
  return sortedMovies.slice(startIndex, endIndex);
}
async function fetchMovieDetails(movieId) {
  const movie = validMovies.find((m) => m.id === movieId);
  return movie || null;
}
async function searchMovies(query, page = 1) {
  if (!query.trim()) return [];
  const pageSize = 20;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const searchResults = validMovies.filter(
    (movie) => movie.title.toLowerCase().includes(query.toLowerCase()) || movie.overview && movie.overview.toLowerCase().includes(query.toLowerCase())
  );
  return searchResults.slice(startIndex, endIndex);
}
async function fetchMoviesByGenre(genreId, page = 1) {
  const pageSize = 20;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const genreMovies = validMovies.filter(
    (movie) => movie.genre_ids.includes(genreId)
  );
  return genreMovies.slice(startIndex, endIndex);
}
async function fetchSimilarMovies(movieId) {
  const movie = validMovies.find((m) => m.id === movieId);
  if (!movie) return [];
  const similarMovies = validMovies.filter((m) => m.id !== movieId && m.genre_ids.some((genreId) => movie.genre_ids.includes(genreId))).sort((a, b) => {
    const aMatches = a.genre_ids.filter((genreId) => movie.genre_ids.includes(genreId)).length;
    const bMatches = b.genre_ids.filter((genreId) => movie.genre_ids.includes(genreId)).length;
    return bMatches - aMatches;
  });
  return similarMovies.slice(0, 20);
}
async function fetchRecommendations(genreIds = [], excludeMovieIds = [], page = 1) {
  const pageSize = 20;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  let recommendedMovies = validMovies;
  if (genreIds.length > 0) {
    recommendedMovies = recommendedMovies.filter(
      (movie) => movie.genre_ids.some((genreId) => genreIds.includes(genreId))
    );
  }
  if (excludeMovieIds.length > 0) {
    recommendedMovies = recommendedMovies.filter(
      (movie) => !excludeMovieIds.includes(movie.id)
    );
  }
  recommendedMovies.sort((a, b) => b.popularity - a.popularity);
  return recommendedMovies.slice(startIndex, endIndex);
}

// server/routes.ts
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}
async function registerRoutes(app2) {
  const initGenres = async () => {
    try {
      const genres3 = await fetchGenres();
      for (const genre of genres3) {
        await storage.createGenre(genre);
      }
      console.log(`Initialized ${genres3.length} genres`);
    } catch (error) {
      console.error("Failed to initialize genres:", error);
    }
  };
  initGenres();
  app2.post("/api/auth/login", async (req, res) => {
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
  app2.post("/api/auth/register", async (req, res) => {
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
  app2.post("/api/auth/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
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
  app2.get("/api/auth/me", async (req, res) => {
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
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { username, email } = req.body;
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      const token = await storage.generateResetToken(username);
      if (!token) {
        return res.status(200).json({
          message: "If an account with that username exists, a password reset link has been sent."
        });
      }
      const { sendPasswordResetEmail: sendPasswordResetEmail2 } = await Promise.resolve().then(() => (init_sendgrid(), sendgrid_exports));
      let emailSent = false;
      if (process.env.SENDGRID_API_KEY && email) {
        emailSent = await sendPasswordResetEmail2(email, token, username);
      }
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
  app2.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
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
  app2.get("/api/genres", async (_req, res) => {
    try {
      const genres3 = await storage.getGenres();
      return res.json(genres3);
    } catch (error) {
      console.error("Get genres error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/movies/popular", async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const movies = await fetchPopularMovies(page);
      return res.json(movies);
    } catch (error) {
      console.error("Get popular movies error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/movies/top-rated", async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const movies = await fetchTopRatedMovies(page);
      return res.json(movies);
    } catch (error) {
      console.error("Get top rated movies error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/movies/search", async (req, res) => {
    try {
      const query = req.query.query;
      const page = parseInt(req.query.page) || 1;
      if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      const movies = await searchMovies(query, page);
      return res.json(movies);
    } catch (error) {
      console.error("Search movies error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/movies/by-genre/:genreId", async (req, res) => {
    try {
      const genreId = parseInt(req.params.genreId);
      const page = parseInt(req.query.page) || 1;
      if (isNaN(genreId)) {
        return res.status(400).json({ message: "Invalid genre ID" });
      }
      const movies = await fetchMoviesByGenre(genreId, page);
      return res.json(movies);
    } catch (error) {
      console.error("Get movies by genre error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/movies/:id", async (req, res) => {
    try {
      const movieId = parseInt(req.params.id);
      if (isNaN(movieId)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      const movie = await fetchMovieDetails(movieId);
      if (!movie) {
        return res.status(404).json({ message: "Movie not found" });
      }
      return res.json(movie);
    } catch (error) {
      console.error("Get movie details error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/movies/:id/similar", async (req, res) => {
    try {
      const movieId = parseInt(req.params.id);
      if (isNaN(movieId)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      const movies = await fetchSimilarMovies(movieId);
      return res.json(movies);
    } catch (error) {
      console.error("Get similar movies error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/user/preferences", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
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
  app2.post("/api/user/preferences", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const preferencesData = {
        ...req.body,
        userId
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
  app2.get("/api/user/ratings", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const ratings = await storage.getUserRatings(userId);
      return res.json(ratings);
    } catch (error) {
      console.error("Get user ratings error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/user/ratings/:movieId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
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
  app2.post("/api/user/ratings", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const ratingData = {
        ...req.body,
        userId
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
  app2.get("/api/user/watchlist", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const watchlist = await storage.getUserWatchlist(userId);
      return res.json(watchlist);
    } catch (error) {
      console.error("Get user watchlist error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/user/watchlist/check/:movieId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
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
  app2.post("/api/user/watchlist", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const watchlistData = {
        ...req.body,
        userId
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
  app2.delete("/api/user/watchlist/:movieId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
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
  app2.get("/api/user/recommendations", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const page = parseInt(req.query.page) || 1;
      const preferences = await storage.getUserPreferences(userId);
      let genreIds = [];
      if (preferences && preferences.genreIds) {
        genreIds = preferences.genreIds;
      }
      const ratings = await storage.getUserRatings(userId);
      const ratedMovieIds = ratings.map((rating) => rating.movieId);
      const recommendations = await fetchRecommendations(genreIds, ratedMovieIds, page);
      return res.json(recommendations);
    } catch (error) {
      console.error("Get recommendations error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/playlists", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const playlists = await storage.getUserPlaylists(userId);
      return res.json(playlists);
    } catch (error) {
      console.error("Get playlists error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/playlists/public", async (req, res) => {
    try {
      const playlists = await storage.getPublicPlaylists();
      return res.json(playlists);
    } catch (error) {
      console.error("Get public playlists error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/playlists/:id", async (req, res) => {
    try {
      const playlistId = parseInt(req.params.id);
      if (isNaN(playlistId)) {
        return res.status(400).json({ message: "Invalid playlist ID" });
      }
      const playlist = await storage.getPlaylist(playlistId);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
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
  app2.post("/api/playlists", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const playlistData = {
        ...req.body,
        userId
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
  app2.put("/api/playlists/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const playlistId = parseInt(req.params.id);
      if (isNaN(playlistId)) {
        return res.status(400).json({ message: "Invalid playlist ID" });
      }
      const existingPlaylist = await storage.getPlaylist(playlistId);
      if (!existingPlaylist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      if (existingPlaylist.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this playlist" });
      }
      const updatedPlaylist = await storage.updatePlaylist(playlistId, req.body);
      return res.json(updatedPlaylist);
    } catch (error) {
      console.error("Update playlist error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/playlists/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const playlistId = parseInt(req.params.id);
      if (isNaN(playlistId)) {
        return res.status(400).json({ message: "Invalid playlist ID" });
      }
      const existingPlaylist = await storage.getPlaylist(playlistId);
      if (!existingPlaylist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      if (existingPlaylist.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this playlist" });
      }
      await storage.deletePlaylist(playlistId);
      return res.json({ message: "Playlist deleted successfully" });
    } catch (error) {
      console.error("Delete playlist error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/playlists/:id/items", async (req, res) => {
    try {
      const playlistId = parseInt(req.params.id);
      if (isNaN(playlistId)) {
        return res.status(400).json({ message: "Invalid playlist ID" });
      }
      const playlist = await storage.getPlaylist(playlistId);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      if (!playlist.isPublic) {
        if (!req.session || !req.session.userId || req.session.userId !== playlist.userId) {
          return res.status(403).json({ message: "You don't have permission to view this playlist" });
        }
      }
      const items = await storage.getPlaylistItems(playlistId);
      const enhancedItems = await Promise.all(
        items.map(async (item) => {
          const movie = await fetchMovieDetails(item.movieId);
          return {
            ...item,
            movie
          };
        })
      );
      return res.json(enhancedItems);
    } catch (error) {
      console.error("Get playlist items error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/playlists/:id/items", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const playlistId = parseInt(req.params.id);
      if (isNaN(playlistId)) {
        return res.status(400).json({ message: "Invalid playlist ID" });
      }
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
  app2.delete("/api/playlists/:id/items/:movieId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const playlistId = parseInt(req.params.id);
      const movieId = parseInt(req.params.movieId);
      if (isNaN(playlistId) || isNaN(movieId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
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
  app2.put("/api/playlists/:id/items/:movieId/notes", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const playlistId = parseInt(req.params.id);
      const movieId = parseInt(req.params.movieId);
      const { notes } = req.body;
      if (isNaN(playlistId) || isNaN(movieId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      if (typeof notes !== "string") {
        return res.status(400).json({ message: "Notes must be a string" });
      }
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
  app2.put("/api/playlists/:id/reorder", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const playlistId = parseInt(req.params.id);
      const { itemIds } = req.body;
      if (isNaN(playlistId)) {
        return res.status(400).json({ message: "Invalid playlist ID" });
      }
      if (!Array.isArray(itemIds)) {
        return res.status(400).json({ message: "itemIds must be an array" });
      }
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import session2 from "express-session";
import dotenv from "dotenv";
dotenv.config();
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use(cors({
  origin: "http://localhost:3001",
  // frontend origin
  credentials: true
}));
app.use(session2({
  secret: "movie-recommender-secret",
  // In production, this should be an environment variable
  resave: false,
  saveUninitialized: false,
  store: new session2.MemoryStore(),
  cookie: {
    secure: false,
    // Set to true if using HTTPS
    maxAge: 7 * 24 * 60 * 60 * 1e3,
    // 7 days
    httpOnly: true,
    sameSite: "lax"
  }
}));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5001;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
