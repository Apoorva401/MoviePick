import {
  users, type User, type InsertUser,
  genres, type Genre, type InsertGenre,
  userPreferences, type UserPreferences, type InsertUserPreferences,
  userRatings, type UserRating, type InsertUserRating,
  userWatchlist, type UserWatchlistItem, type InsertUserWatchlistItem,
  userPlaylists, type UserPlaylist, type InsertUserPlaylist,
  playlistItems, type PlaylistItem, type InsertPlaylistItem
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
  
  // User Playlist methods
  getUserPlaylists(userId: number): Promise<UserPlaylist[]>;
  getPlaylist(playlistId: number): Promise<UserPlaylist | undefined>;
  getPublicPlaylists(): Promise<UserPlaylist[]>;
  createPlaylist(playlist: InsertUserPlaylist): Promise<UserPlaylist>;
  updatePlaylist(playlistId: number, updates: Partial<Omit<InsertUserPlaylist, "userId">>): Promise<UserPlaylist | undefined>;
  deletePlaylist(playlistId: number): Promise<void>;
  
  // Playlist Item methods
  getPlaylistItems(playlistId: number): Promise<PlaylistItem[]>;
  addItemToPlaylist(item: InsertPlaylistItem): Promise<PlaylistItem>;
  removeItemFromPlaylist(playlistId: number, movieId: number): Promise<void>;
  updatePlaylistItemNotes(playlistId: number, movieId: number, notes: string): Promise<PlaylistItem | undefined>;
  reorderPlaylistItems(playlistId: number, itemIds: number[]): Promise<void>;
  
  // Session store for auth
  sessionStore: any; // Using any to avoid type issues with express-session
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private genres: Map<number, Genre>;
  private userPreferences: Map<number, UserPreferences>;
  private userRatings: Map<number, UserRating>;
  private userWatchlist: Map<number, UserWatchlistItem>;
  private userPlaylists: Map<number, UserPlaylist>;
  private playlistItems: Map<number, PlaylistItem>;
  
  private currentUserId: number;
  private currentPreferencesId: number;
  private currentRatingId: number;
  private currentWatchlistId: number;
  private currentPlaylistId: number;
  private currentPlaylistItemId: number;
  
  sessionStore: any; // Using any to avoid type issues with express-session

  constructor() {
    this.users = new Map();
    this.genres = new Map();
    this.userPreferences = new Map();
    this.userRatings = new Map();
    this.userWatchlist = new Map();
    this.userPlaylists = new Map();
    this.playlistItems = new Map();
    
    this.currentUserId = 1;
    this.currentPreferencesId = 1;
    this.currentRatingId = 1;
    this.currentWatchlistId = 1;
    this.currentPlaylistId = 1;
    this.currentPlaylistItemId = 1;

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
  
  // User Playlist methods
  async getUserPlaylists(userId: number): Promise<UserPlaylist[]> {
    return Array.from(this.userPlaylists.values()).filter(
      (playlist) => playlist.userId === userId
    );
  }
  
  async getPlaylist(playlistId: number): Promise<UserPlaylist | undefined> {
    return this.userPlaylists.get(playlistId);
  }
  
  async getPublicPlaylists(): Promise<UserPlaylist[]> {
    return Array.from(this.userPlaylists.values()).filter(
      (playlist) => playlist.isPublic
    );
  }
  
  async createPlaylist(playlist: InsertUserPlaylist): Promise<UserPlaylist> {
    const id = this.currentPlaylistId++;
    const now = new Date();
    const newPlaylist: UserPlaylist = {
      id,
      userId: playlist.userId,
      name: playlist.name,
      description: playlist.description || null,
      isPublic: playlist.isPublic || false,
      createdAt: now,
      updatedAt: now
    };
    
    this.userPlaylists.set(id, newPlaylist);
    return newPlaylist;
  }
  
  async updatePlaylist(
    playlistId: number, 
    updates: Partial<Omit<InsertUserPlaylist, "userId">>
  ): Promise<UserPlaylist | undefined> {
    const playlist = await this.getPlaylist(playlistId);
    if (!playlist) return undefined;
    
    const updatedPlaylist: UserPlaylist = {
      ...playlist,
      name: updates.name !== undefined ? updates.name : playlist.name,
      description: updates.description !== undefined ? updates.description : playlist.description,
      isPublic: updates.isPublic !== undefined ? updates.isPublic : playlist.isPublic,
      updatedAt: new Date()
    };
    
    this.userPlaylists.set(playlistId, updatedPlaylist);
    return updatedPlaylist;
  }
  
  async deletePlaylist(playlistId: number): Promise<void> {
    // First remove all items in the playlist
    const items = Array.from(this.playlistItems.values()).filter(
      (item) => item.playlistId === playlistId
    );
    
    for (const item of items) {
      this.playlistItems.delete(item.id);
    }
    
    // Then delete the playlist itself
    this.userPlaylists.delete(playlistId);
  }
  
  // Playlist Item methods
  async getPlaylistItems(playlistId: number): Promise<PlaylistItem[]> {
    return Array.from(this.playlistItems.values())
      .filter((item) => item.playlistId === playlistId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  
  async addItemToPlaylist(item: InsertPlaylistItem): Promise<PlaylistItem> {
    const id = this.currentPlaylistItemId++;
    const now = new Date();
    
    // Get the highest sort order
    const items = await this.getPlaylistItems(item.playlistId);
    const maxSortOrder = items.length > 0 
      ? Math.max(...items.map(i => i.sortOrder || 0)) 
      : -1;
    
    const newItem: PlaylistItem = {
      id,
      playlistId: item.playlistId,
      movieId: item.movieId,
      addedAt: now,
      sortOrder: item.sortOrder !== undefined ? item.sortOrder : maxSortOrder + 1,
      notes: item.notes || null
    };
    
    this.playlistItems.set(id, newItem);
    return newItem;
  }
  
  async removeItemFromPlaylist(playlistId: number, movieId: number): Promise<void> {
    const item = Array.from(this.playlistItems.values()).find(
      (item) => item.playlistId === playlistId && item.movieId === movieId
    );
    
    if (item) {
      this.playlistItems.delete(item.id);
    }
  }
  
  async updatePlaylistItemNotes(
    playlistId: number, 
    movieId: number, 
    notes: string
  ): Promise<PlaylistItem | undefined> {
    const item = Array.from(this.playlistItems.values()).find(
      (item) => item.playlistId === playlistId && item.movieId === movieId
    );
    
    if (!item) return undefined;
    
    const updatedItem: PlaylistItem = {
      ...item,
      notes
    };
    
    this.playlistItems.set(item.id, updatedItem);
    return updatedItem;
  }
  
  async reorderPlaylistItems(playlistId: number, itemIds: number[]): Promise<void> {
    // Update each item with new sort order
    for (let i = 0; i < itemIds.length; i++) {
      const item = this.playlistItems.get(itemIds[i]);
      if (item && item.playlistId === playlistId) {
        this.playlistItems.set(itemIds[i], {
          ...item,
          sortOrder: i
        });
      }
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
  
  // User Playlist methods
  async getUserPlaylists(userId: number): Promise<UserPlaylist[]> {
    return db
      .select()
      .from(userPlaylists)
      .where(eq(userPlaylists.userId, userId));
  }
  
  async getPlaylist(playlistId: number): Promise<UserPlaylist | undefined> {
    const [playlist] = await db
      .select()
      .from(userPlaylists)
      .where(eq(userPlaylists.id, playlistId));
    
    return playlist;
  }
  
  async getPublicPlaylists(): Promise<UserPlaylist[]> {
    return db
      .select()
      .from(userPlaylists)
      .where(eq(userPlaylists.isPublic, true));
  }
  
  async createPlaylist(playlist: InsertUserPlaylist): Promise<UserPlaylist> {
    const now = new Date();
    const [newPlaylist] = await db
      .insert(userPlaylists)
      .values({
        ...playlist,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    
    return newPlaylist;
  }
  
  async updatePlaylist(
    playlistId: number, 
    updates: Partial<Omit<InsertUserPlaylist, "userId">>
  ): Promise<UserPlaylist | undefined> {
    const [updatedPlaylist] = await db
      .update(userPlaylists)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(userPlaylists.id, playlistId))
      .returning();
    
    return updatedPlaylist;
  }
  
  async deletePlaylist(playlistId: number): Promise<void> {
    // First delete all items in the playlist
    await db
      .delete(playlistItems)
      .where(eq(playlistItems.playlistId, playlistId));
    
    // Then delete the playlist itself
    await db
      .delete(userPlaylists)
      .where(eq(userPlaylists.id, playlistId));
  }
  
  // Playlist Item methods
  async getPlaylistItems(playlistId: number): Promise<PlaylistItem[]> {
    return db
      .select()
      .from(playlistItems)
      .where(eq(playlistItems.playlistId, playlistId))
      .orderBy(playlistItems.sortOrder);
  }
  
  async addItemToPlaylist(item: InsertPlaylistItem): Promise<PlaylistItem> {
    // Get the highest sort order
    const items = await this.getPlaylistItems(item.playlistId);
    const maxSortOrder = items.length > 0 
      ? Math.max(...items.map(i => i.sortOrder || 0)) 
      : -1;
    
    const [newItem] = await db
      .insert(playlistItems)
      .values({
        ...item,
        sortOrder: item.sortOrder !== undefined ? item.sortOrder : maxSortOrder + 1,
        addedAt: new Date()
      })
      .returning();
    
    return newItem;
  }
  
  async removeItemFromPlaylist(playlistId: number, movieId: number): Promise<void> {
    await db
      .delete(playlistItems)
      .where(
        and(
          eq(playlistItems.playlistId, playlistId),
          eq(playlistItems.movieId, movieId)
        )
      );
  }
  
  async updatePlaylistItemNotes(
    playlistId: number, 
    movieId: number, 
    notes: string
  ): Promise<PlaylistItem | undefined> {
    const [updatedItem] = await db
      .update(playlistItems)
      .set({ notes })
      .where(
        and(
          eq(playlistItems.playlistId, playlistId),
          eq(playlistItems.movieId, movieId)
        )
      )
      .returning();
    
    return updatedItem;
  }
  
  async reorderPlaylistItems(playlistId: number, itemIds: number[]): Promise<void> {
    // Update each item with new sort order
    for (let i = 0; i < itemIds.length; i++) {
      await db
        .update(playlistItems)
        .set({ sortOrder: i })
        .where(
          and(
            eq(playlistItems.id, itemIds[i]),
            eq(playlistItems.playlistId, playlistId)
          )
        );
    }
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
