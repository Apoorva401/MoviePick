import {
  users, type User, type InsertUser,
  genres, type Genre, type InsertGenre,
  userPreferences, type UserPreferences, type InsertUserPreferences,
  userRatings, type UserRating, type InsertUserRating,
  userWatchlist, type UserWatchlistItem, type InsertUserWatchlistItem
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import createMemoryStore from "memorystore";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Password Reset methods
  getUserByResetToken(token: string): Promise<User | undefined>;
  generateResetToken(username: string): Promise<string | null>;
  updatePassword(userId: number, newPassword: string): Promise<User | undefined>;
  
  // Genre methods
  getGenres(): Promise<Genre[]>;
  getGenre(id: number): Promise<Genre | undefined>;
  createGenre(genre: InsertGenre): Promise<Genre>;
  
  // User Preferences methods
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createOrUpdateUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  
  // User Ratings methods
  getUserRatings(userId: number): Promise<UserRating[]>;
  getUserRatingForMovie(userId: number, movieId: number): Promise<UserRating | undefined>;
  createOrUpdateUserRating(rating: InsertUserRating): Promise<UserRating>;
  
  // User Watchlist methods
  getUserWatchlist(userId: number): Promise<UserWatchlistItem[]>;
  isMovieInWatchlist(userId: number, movieId: number): Promise<boolean>;
  addToWatchlist(watchlistItem: InsertUserWatchlistItem): Promise<UserWatchlistItem>;
  removeFromWatchlist(userId: number, movieId: number): Promise<void>;
  
  // Session store for auth
  sessionStore: any; // Using any to avoid type issues with express-session
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private genres: Map<number, Genre>;
  private userPreferences: Map<number, UserPreferences>;
  private userRatings: Map<number, UserRating>;
  private userWatchlist: Map<number, UserWatchlistItem>;
  
  private currentUserId: number;
  private currentPreferencesId: number;
  private currentRatingId: number;
  private currentWatchlistId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.genres = new Map();
    this.userPreferences = new Map();
    this.userRatings = new Map();
    this.userWatchlist = new Map();
    
    this.currentUserId = 1;
    this.currentPreferencesId = 1;
    this.currentRatingId = 1;
    this.currentWatchlistId = 1;

    // Create a memory store for sessions
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });

    // Add a default user
    this.createUser({
      username: "demo",
      password: "password",
      name: "Demo User",
      avatar: "",
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      name: insertUser.name || null,
      avatar: insertUser.avatar || null,
      createdAt: now,
      resetToken: null,
      resetTokenExpiry: null
    };
    this.users.set(id, user);
    return user;
  }

  // Password Reset methods
  async getUserByResetToken(token: string): Promise<User | undefined> {
    const now = new Date();
    return Array.from(this.users.values()).find(
      (user) => user.resetToken === token && user.resetTokenExpiry && new Date(user.resetTokenExpiry) > now
    );
  }

  async generateResetToken(username: string): Promise<string | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;

    // Generate a random token
    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    
    // Set token expiry (24 hours from now)
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    
    // Update user with reset token and expiry
    const updatedUser = { 
      ...user, 
      resetToken: token, 
      resetTokenExpiry: expiry 
    };
    
    this.users.set(user.id, updatedUser);
    return token;
  }

  async updatePassword(userId: number, newPassword: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    // Update user password and clear reset token
    const updatedUser = { 
      ...user, 
      password: newPassword,
      resetToken: null,
      resetTokenExpiry: null
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Genre methods
  async getGenres(): Promise<Genre[]> {
    return Array.from(this.genres.values());
  }

  async getGenre(id: number): Promise<Genre | undefined> {
    return this.genres.get(id);
  }

  async createGenre(genre: InsertGenre): Promise<Genre> {
    if (!this.genres.has(genre.id)) {
      this.genres.set(genre.id, genre);
    }
    return genre;
  }

  // User Preferences methods
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferences.values()).find(
      (preferences) => preferences.userId === userId,
    );
  }

  async createOrUpdateUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const existingPreferences = await this.getUserPreferences(preferences.userId);
    
    if (existingPreferences) {
      const updatedPreferences: UserPreferences = {
        id: existingPreferences.id,
        userId: preferences.userId,
        genreIds: Array.isArray(preferences.genreIds) ? preferences.genreIds : null,
        actorIds: Array.isArray(preferences.actorIds) ? preferences.actorIds : null,
        directorIds: Array.isArray(preferences.directorIds) ? preferences.directorIds : null,
      };
      this.userPreferences.set(existingPreferences.id, updatedPreferences);
      return updatedPreferences;
    } else {
      const id = this.currentPreferencesId++;
      const newPreferences: UserPreferences = { 
        id,
        userId: preferences.userId,
        genreIds: Array.isArray(preferences.genreIds) ? preferences.genreIds : null,
        actorIds: Array.isArray(preferences.actorIds) ? preferences.actorIds : null,
        directorIds: Array.isArray(preferences.directorIds) ? preferences.directorIds : null,
      };
      this.userPreferences.set(id, newPreferences);
      return newPreferences;
    }
  }

  // User Ratings methods
  async getUserRatings(userId: number): Promise<UserRating[]> {
    return Array.from(this.userRatings.values()).filter(
      (rating) => rating.userId === userId,
    );
  }

  async getUserRatingForMovie(userId: number, movieId: number): Promise<UserRating | undefined> {
    return Array.from(this.userRatings.values()).find(
      (rating) => rating.userId === userId && rating.movieId === movieId,
    );
  }

  async createOrUpdateUserRating(rating: InsertUserRating): Promise<UserRating> {
    const existingRating = await this.getUserRatingForMovie(rating.userId, rating.movieId);
    
    if (existingRating) {
      const updatedRating: UserRating = {
        ...existingRating,
        rating: rating.rating,
      };
      this.userRatings.set(existingRating.id, updatedRating);
      return updatedRating;
    } else {
      const id = this.currentRatingId++;
      const now = new Date();
      const newRating: UserRating = { ...rating, id, createdAt: now };
      this.userRatings.set(id, newRating);
      return newRating;
    }
  }

  // User Watchlist methods
  async getUserWatchlist(userId: number): Promise<UserWatchlistItem[]> {
    return Array.from(this.userWatchlist.values()).filter(
      (item) => item.userId === userId,
    );
  }

  async isMovieInWatchlist(userId: number, movieId: number): Promise<boolean> {
    return Array.from(this.userWatchlist.values()).some(
      (item) => item.userId === userId && item.movieId === movieId,
    );
  }

  async addToWatchlist(watchlistItem: InsertUserWatchlistItem): Promise<UserWatchlistItem> {
    const isInWatchlist = await this.isMovieInWatchlist(watchlistItem.userId, watchlistItem.movieId);
    
    if (!isInWatchlist) {
      const id = this.currentWatchlistId++;
      const now = new Date();
      const newWatchlistItem: UserWatchlistItem = { ...watchlistItem, id, addedAt: now };
      this.userWatchlist.set(id, newWatchlistItem);
      return newWatchlistItem;
    } else {
      const existingItem = Array.from(this.userWatchlist.values()).find(
        (item) => item.userId === watchlistItem.userId && item.movieId === watchlistItem.movieId,
      )!;
      return existingItem;
    }
  }

  async removeFromWatchlist(userId: number, movieId: number): Promise<void> {
    const item = Array.from(this.userWatchlist.values()).find(
      (item) => item.userId === userId && item.movieId === movieId,
    );
    
    if (item) {
      this.userWatchlist.delete(item.id);
    }
  }
}

import { eq, and } from "drizzle-orm";
import { db } from "./db";

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    // Create a PostgreSQL session store
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: insertUser.username,
        password: insertUser.password,
        name: insertUser.name || null,
        avatar: insertUser.avatar || null,
        createdAt: new Date(),
        resetToken: null,
        resetTokenExpiry: null
      })
      .returning();
    return user;
  }

  // Password Reset methods
  async getUserByResetToken(token: string): Promise<User | undefined> {
    const now = new Date();
    const [user] = await db
      .select()
      .from(users)
      .where(
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

  async generateResetToken(username: string): Promise<string | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;

    // Generate a random token
    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    
    // Set token expiry (24 hours from now)
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    
    // Update user with reset token and expiry
    await db
      .update(users)
      .set({
        resetToken: token,
        resetTokenExpiry: expiry
      })
      .where(eq(users.id, user.id));
    
    return token;
  }

  async updatePassword(userId: number, newPassword: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        password: newPassword,
        resetToken: null,
        resetTokenExpiry: null
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  // Genre methods
  async getGenres(): Promise<Genre[]> {
    return db.select().from(genres);
  }

  async getGenre(id: number): Promise<Genre | undefined> {
    const [genre] = await db.select().from(genres).where(eq(genres.id, id));
    return genre;
  }

  async createGenre(genre: InsertGenre): Promise<Genre> {
    const [newGenre] = await db
      .insert(genres)
      .values(genre)
      .onConflictDoUpdate({
        target: genres.id,
        set: { name: genre.name }
      })
      .returning();
    
    return newGenre;
  }

  // User Preferences methods
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    
    return preferences;
  }

  async createOrUpdateUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const existingPreferences = await this.getUserPreferences(preferences.userId);
    
    if (existingPreferences) {
      const [updatedPreferences] = await db
        .update(userPreferences)
        .set({
          genreIds: preferences.genreIds,
          actorIds: preferences.actorIds,
          directorIds: preferences.directorIds
        })
        .where(eq(userPreferences.id, existingPreferences.id))
        .returning();
      
      return updatedPreferences;
    } else {
      const [newPreferences] = await db
        .insert(userPreferences)
        .values(preferences)
        .returning();
      
      return newPreferences;
    }
  }

  // User Ratings methods
  async getUserRatings(userId: number): Promise<UserRating[]> {
    return db
      .select()
      .from(userRatings)
      .where(eq(userRatings.userId, userId));
  }

  async getUserRatingForMovie(userId: number, movieId: number): Promise<UserRating | undefined> {
    const [rating] = await db
      .select()
      .from(userRatings)
      .where(
        and(
          eq(userRatings.userId, userId),
          eq(userRatings.movieId, movieId)
        )
      );
    
    return rating;
  }

  async createOrUpdateUserRating(rating: InsertUserRating): Promise<UserRating> {
    const existingRating = await this.getUserRatingForMovie(rating.userId, rating.movieId);
    
    if (existingRating) {
      const [updatedRating] = await db
        .update(userRatings)
        .set({ rating: rating.rating })
        .where(eq(userRatings.id, existingRating.id))
        .returning();
      
      return updatedRating;
    } else {
      const [newRating] = await db
        .insert(userRatings)
        .values({
          ...rating,
          createdAt: new Date()
        })
        .returning();
      
      return newRating;
    }
  }

  // User Watchlist methods
  async getUserWatchlist(userId: number): Promise<UserWatchlistItem[]> {
    return db
      .select()
      .from(userWatchlist)
      .where(eq(userWatchlist.userId, userId));
  }

  async isMovieInWatchlist(userId: number, movieId: number): Promise<boolean> {
    const [item] = await db
      .select()
      .from(userWatchlist)
      .where(
        and(
          eq(userWatchlist.userId, userId),
          eq(userWatchlist.movieId, movieId)
        )
      );
    
    return !!item;
  }

  async addToWatchlist(watchlistItem: InsertUserWatchlistItem): Promise<UserWatchlistItem> {
    const isInWatchlist = await this.isMovieInWatchlist(watchlistItem.userId, watchlistItem.movieId);
    
    if (!isInWatchlist) {
      const [newItem] = await db
        .insert(userWatchlist)
        .values({
          ...watchlistItem,
          addedAt: new Date()
        })
        .returning();
      
      return newItem;
    } else {
      const [existingItem] = await db
        .select()
        .from(userWatchlist)
        .where(
          and(
            eq(userWatchlist.userId, watchlistItem.userId),
            eq(userWatchlist.movieId, watchlistItem.movieId)
          )
        );
      
      return existingItem;
    }
  }

  async removeFromWatchlist(userId: number, movieId: number): Promise<void> {
    await db
      .delete(userWatchlist)
      .where(
        and(
          eq(userWatchlist.userId, userId),
          eq(userWatchlist.movieId, movieId)
        )
      );
  }
}

export const storage = new DatabaseStorage();
