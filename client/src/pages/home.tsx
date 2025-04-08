import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieCard from "@/components/movie-card";
import HorizontalMovieCard from "@/components/horizontal-movie-card";
import MovieDetailModal from "@/components/movie-detail-modal";
import GenreFilters from "@/components/genre-filters";
import * as api from "@/lib/api";
import { Movie } from "@shared/schema";

export default function Home() {
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch popular movies
  const { data: popularMovies, isLoading: loadingPopular } = useQuery({
    queryKey: ["/api/movies/popular"],
    queryFn: () => api.getPopularMovies(),
  });

  // Fetch top rated movies
  const { data: topRatedMovies, isLoading: loadingTopRated } = useQuery({
    queryKey: ["/api/movies/top-rated"],
    queryFn: () => api.getTopRatedMovies(),
  });

  // Fetch recommendations
  const { data: recommendedMovies, isLoading: loadingRecommended } = useQuery({
    queryKey: ["/api/user/recommendations"],
    queryFn: () => api.getRecommendations(),
    onError: () => {
      // Fallback to popular movies if recommendations fail
      // (might happen if user is not logged in)
    },
  });

  // Get first movie for hero section
  const featuredMovie = popularMovies && popularMovies.length > 0 ? popularMovies[0] : null;

  // Handle genre selection
  const handleGenreSelect = (genreId: number) => {
    setSelectedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  // Handle movie details view
  const handleViewMovieDetails = (movie: Movie) => {
    setSelectedMovieId(movie.id);
    setIsModalOpen(true);
  };

  // Get filtered movies based on selected genres
  const filteredRecommendedMovies = recommendedMovies && selectedGenres.length > 0
    ? recommendedMovies.filter(movie => 
        movie.genre_ids?.some(id => selectedGenres.includes(id))
      )
    : recommendedMovies;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        {/* Hero Section */}
        {loadingPopular ? (
          <div className="h-[500px] flex justify-center items-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : featuredMovie ? (
          <section 
            className="relative h-[500px] md:h-[600px] bg-cover bg-center overflow-hidden" 
            style={{
              backgroundImage: `url(${api.getBackdropUrl(featuredMovie.backdrop_path)})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent"></div>
            <div className="container mx-auto px-4 relative h-full flex flex-col justify-center">
              <h1 className="font-bold text-3xl md:text-5xl lg:text-6xl max-w-2xl">
                {featuredMovie.title}
              </h1>
              <div className="flex items-center mt-3 space-x-4">
                <span className="bg-muted px-2 py-1 rounded text-sm">
                  {featuredMovie.release_date ? new Date(featuredMovie.release_date).getFullYear() : ""}
                </span>
                <span className="bg-muted px-2 py-1 rounded text-sm">
                  {featuredMovie.adult ? "R" : "PG-13"}
                </span>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="font-mono">
                    {featuredMovie.vote_average ? featuredMovie.vote_average.toFixed(1) : "N/A"}
                  </span>
                </div>
              </div>
              <p className="mt-4 text-foreground/90 max-w-xl text-sm md:text-base">
                {featuredMovie.overview}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={() => handleViewMovieDetails(featuredMovie)}
                >
                  View Details
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <div className="h-[500px] flex justify-center items-center">
            <p>No featured movie available</p>
          </div>
        )}

        {/* Filter Section */}
        <section className="py-8 bg-muted">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-6">
              <h2 className="font-bold text-2xl">Discover Movies</h2>
              
              <div className="flex flex-wrap gap-3 items-center">
                <Link href="/discover">
                  <Button variant="outline">
                    More Filters
                  </Button>
                </Link>
              </div>
            </div>
            
            <GenreFilters
              selectedGenreIds={selectedGenres}
              onGenreSelect={handleGenreSelect}
            />
          </div>
        </section>

        {/* Recommendation Section */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <h2 className="font-bold text-2xl mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                MoviePick's
              </span> Picks For You
            </h2>
            
            {loadingRecommended ? (
              <div className="h-64 flex justify-center items-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredRecommendedMovies && filteredRecommendedMovies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {filteredRecommendedMovies.slice(0, 10).map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onViewDetails={handleViewMovieDetails}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">No recommendations available.</p>
                <Button asChild>
                  <Link href="/discover">Browse Movies</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Top Rated Section */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-2xl">Top Rated</h2>
              <Button variant="link" asChild>
                <Link href="/discover" className="text-primary hover:underline flex items-center">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            {loadingTopRated ? (
              <div className="h-64 flex justify-center items-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : topRatedMovies && topRatedMovies.length > 0 ? (
              <div className="relative">
                <div className="overflow-x-auto pb-2 flex gap-4 md:gap-6 scrollbar-hide">
                  {topRatedMovies.slice(0, 10).map((movie) => (
                    <div key={movie.id} className="flex-none w-[160px] sm:w-[180px] md:w-[200px] group cursor-pointer"
                      onClick={() => handleViewMovieDetails(movie)}
                    >
                      <div className="relative rounded-lg overflow-hidden bg-muted aspect-[2/3] transform transition-transform group-hover:scale-105">
                        <img 
                          src={api.getPosterUrl(movie.poster_path)}
                          alt={`${movie.title} poster`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2 p-2 bg-background/50 rounded-full flex items-center justify-center">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="font-mono text-xs ml-1">
                            {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                          </span>
                        </div>
                      </div>
                      <h3 className="font-medium text-sm mt-2 line-clamp-1">{movie.title}</h3>
                      <p className="text-muted-foreground text-xs">
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No top rated movies available.</p>
              </div>
            )}
          </div>
        </section>
        
        {/* Popular Section */}
        <section className="py-8 bg-muted">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-2xl">Popular Now</h2>
              <Button variant="link" asChild>
                <Link href="/discover" className="text-primary hover:underline flex items-center">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            {loadingPopular ? (
              <div className="h-64 flex justify-center items-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : popularMovies && popularMovies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularMovies.slice(1, 4).map((movie) => (
                  <HorizontalMovieCard
                    key={movie.id}
                    movie={movie}
                    onViewDetails={handleViewMovieDetails}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No popular movies available.</p>
              </div>
            )}
          </div>
        </section>
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
