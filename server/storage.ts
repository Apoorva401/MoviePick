import {
  users, type User, type InsertUser,
  genres, type Genre, type InsertGenre,
  userPreferences, type UserPreferences, type InsertUserPreferences,
  userRatings, type UserRating, type InsertUserRating,
  userWatchlist, type UserWatchlistItem, type InsertUserWatchlistItem
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
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
        ...existingPreferences,
        ...preferences,
      };
      this.userPreferences.set(existingPreferences.id, updatedPreferences);
      return updatedPreferences;
    } else {
      const id = this.currentPreferencesId++;
      const newPreferences: UserPreferences = { ...preferences, id };
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

export const storage = new MemStorage();
