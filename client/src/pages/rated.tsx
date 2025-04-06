import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieDetailModal from "@/components/movie-detail-modal";
import * as api from "@/lib/api";
import { Movie } from "@shared/schema";

export default function Rated() {
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get current user
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // Fetch user's ratings
  const {
    data: ratings,
    isLoading: isLoadingRatings,
    error: ratingsError,
  } = useQuery({
    queryKey: ["/api/user/ratings"],
    enabled: !!currentUser,
  });

  // Fetch movie details for each rated movie
  const {
    data: ratedMovies,
    isLoading: isLoadingMovies,
    error: moviesError,
  } = useQuery({
    queryKey: ["/api/user/ratings/movies"],
    queryFn: async () => {
      if (!ratings || ratings.length === 0) return [];
      
      const movies = await Promise.all(
        ratings.map(async (item: any) => {
          try {
            const movie = await api.getMovieDetails(item.movieId);
            return {
              ...movie,
              userRating: item.rating
            };
          } catch (error) {
            console.error(`Failed to fetch movie ${item.movieId}:`, error);
            return null;
          }
        })
      );
      
      return movies.filter(Boolean) as (Movie & { userRating: number })[];
    },
    enabled: !!ratings && ratings.length > 0,
  });

  // Handle movie details view
  const handleViewMovieDetails = (movie: Movie) => {
    setSelectedMovieId(movie.id);
    setIsModalOpen(true);
  };

  const isLoading = isLoadingUser || isLoadingRatings || isLoadingMovies;
  const isError = !!ratingsError || !!moviesError;
  const isAuthenticated = !!currentUser;
  const hasMovies = !!ratedMovies && ratedMovies.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Rated Movies</h1>

        {isLoading ? (
          <div className="h-64 flex justify-center items-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : !isAuthenticated ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold mb-2">Sign In to View Your Rated Movies</h3>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to rate movies and view your ratings.
            </p>
            <Button asChild>
              <Link href="/profile">Sign In</Link>
            </Button>
          </div>
        ) : isError ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold mb-2">Something Went Wrong</h3>
            <p className="text-muted-foreground mb-6">
              We encountered an error while loading your rated movies. Please try again later.
            </p>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </div>
        ) : !hasMovies ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold mb-2">You Haven't Rated Any Movies Yet</h3>
            <p className="text-muted-foreground mb-6">
              Rate movies to keep track of what you've watched and help improve your recommendations.
            </p>
            <Button asChild>
              <Link href="/discover">Browse Movies to Rate</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ratedMovies.map((movie) => (
              <div 
                key={movie.id} 
                className="flex bg-card rounded-lg overflow-hidden h-[180px] cursor-pointer transition-transform hover:scale-[1.02]"
                onClick={() => handleViewMovieDetails(movie)}
              >
                <img
                  src={api.getPosterUrl(movie.poster_path, "w200")}
                  alt={`${movie.title} poster`}
                  className="w-[120px] object-cover"
                  loading="lazy"
                />
                <div className="flex flex-col p-4 flex-1 justify-between">
                  <div>
                    <h3 className="font-bold text-lg line-clamp-1">{movie.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {movie.release_date ? new Date(movie.release_date).getFullYear() : ""}
                      {movie.genres?.length > 0 && ` • ${movie.genres.map(g => g.name).join(', ')}`}
                    </p>
                    <div className="flex items-center mt-2">
                      <div className="flex mr-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-4 w-4 ${
                              star <= movie.userRating ? 'text-yellow-500' : 'text-muted'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="font-mono text-sm">
                        Your rating: {movie.userRating}.0
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="font-mono">
                        {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                      </span>
                    </div>
                    <Button
                      variant="link"
                      className="text-primary hover:text-primary/80 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewMovieDetails(movie);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
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
