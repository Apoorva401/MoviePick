import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieCard from "@/components/movie-card";
import MovieDetailModal from "@/components/movie-detail-modal";
import * as api from "@/lib/api";
import { Movie } from "@shared/schema";

export default function Watchlist() {
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get current user
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // Fetch user's watchlist
  const {
    data: watchlist,
    isLoading: isLoadingWatchlist,
    error: watchlistError,
  } = useQuery({
    queryKey: ["/api/user/watchlist"],
    enabled: !!currentUser,
  });

  // Fetch movie details for each watchlist item
  const {
    data: watchlistMovies,
    isLoading: isLoadingMovies,
    error: moviesError,
  } = useQuery({
    queryKey: ["/api/user/watchlist/movies"],
    queryFn: async () => {
      if (!watchlist || watchlist.length === 0) return [];
      
      const movies = await Promise.all(
        watchlist.map(async (item: any) => {
          try {
            return await api.getMovieDetails(item.movieId);
          } catch (error) {
            console.error(`Failed to fetch movie ${item.movieId}:`, error);
            return null;
          }
        })
      );
      
      return movies.filter(Boolean) as Movie[];
    },
    enabled: !!watchlist && watchlist.length > 0,
  });

  // Handle movie details view
  const handleViewMovieDetails = (movie: Movie) => {
    setSelectedMovieId(movie.id);
    setIsModalOpen(true);
  };

  const isLoading = isLoadingUser || isLoadingWatchlist || isLoadingMovies;
  const isError = !!watchlistError || !!moviesError;
  const isAuthenticated = !!currentUser;
  const hasMovies = !!watchlistMovies && watchlistMovies.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>

        {isLoading ? (
          <div className="h-64 flex justify-center items-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : !isAuthenticated ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold mb-2">Sign In to View Your Watchlist</h3>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to create and view your watchlist.
            </p>
            <Button asChild>
              <Link href="/profile">Sign In</Link>
            </Button>
          </div>
        ) : isError ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold mb-2">Something Went Wrong</h3>
            <p className="text-muted-foreground mb-6">
              We encountered an error while loading your watchlist. Please try again later.
            </p>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </div>
        ) : !hasMovies ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold mb-2">Your Watchlist is Empty</h3>
            <p className="text-muted-foreground mb-6">
              You haven't added any movies to your watchlist yet.
            </p>
            <Button asChild>
              <Link href="/discover">
                <PlusCircle className="mr-2 h-4 w-4" /> Browse Movies
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {watchlistMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onViewDetails={handleViewMovieDetails}
                isInWatchlist={true}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Movie Detail Modal */}
      <MovieDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        movieId={selectedMovieId}
      />
    </div>
  );
}
