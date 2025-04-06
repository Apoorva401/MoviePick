import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, Play, Bookmark, BookmarkCheck, X } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { Movie } from "@shared/schema";
import { getPosterUrl, getBackdropUrl } from "@/lib/api";

interface MovieDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieId: number | null;
}

export default function MovieDetailModal({
  isOpen,
  onClose,
  movieId,
}: MovieDetailModalProps) {
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch movie details
  const {
    data: movie,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/movies", movieId],
    queryFn: () => (movieId ? api.getMovieDetails(movieId) : null),
    enabled: !!movieId && isOpen,
  });

  // Fetch similar movies
  const { data: similarMovies } = useQuery({
    queryKey: ["/api/movies", movieId, "similar"],
    queryFn: () => (movieId ? api.getSimilarMovies(movieId) : []),
    enabled: !!movieId && isOpen,
  });

  // Fetch user rating for this movie
  const { data: userRatingData } = useQuery({
    queryKey: ["/api/user/ratings", movieId],
    queryFn: () => (movieId ? api.getUserRatingForMovie(movieId) : null),
    enabled: !!movieId && isOpen,
    retry: false,
  });

  // Check if movie is in user's watchlist
  const { data: watchlistData } = useQuery({
    queryKey: ["/api/user/watchlist/check", movieId],
    queryFn: () => (movieId ? api.checkIfMovieInWatchlist(movieId) : false),
    enabled: !!movieId && isOpen,
    retry: false,
  });

  // Rate movie mutation
  const rateMutation = useMutation({
    mutationFn: ({ movieId, rating }: { movieId: number; rating: number }) =>
      api.rateMovie(movieId, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/ratings"] });
      toast({
        title: "Rating Saved",
        description: "Your rating has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save your rating. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add to watchlist mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: api.addToWatchlist,
    onSuccess: () => {
      setIsInWatchlist(true);
      queryClient.invalidateQueries({ queryKey: ["/api/user/watchlist"] });
      toast({
        title: "Added to Watchlist",
        description: movie?.title
          ? `${movie.title} has been added to your watchlist.`
          : "Movie has been added to your watchlist.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add to watchlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove from watchlist mutation
  const removeFromWatchlistMutation = useMutation({
    mutationFn: api.removeFromWatchlist,
    onSuccess: () => {
      setIsInWatchlist(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user/watchlist"] });
      toast({
        title: "Removed from Watchlist",
        description: movie?.title
          ? `${movie.title} has been removed from your watchlist.`
          : "Movie has been removed from your watchlist.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from watchlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update local state from query data
  useEffect(() => {
    if (userRatingData) {
      setUserRating(userRatingData.rating);
    } else {
      setUserRating(null);
    }
  }, [userRatingData]);

  useEffect(() => {
    if (watchlistData !== undefined) {
      setIsInWatchlist(watchlistData);
    }
  }, [watchlistData]);

  const handleRateMovie = (rating: number) => {
    if (!movieId) return;
    setUserRating(rating);
    rateMutation.mutate({ movieId, rating });
  };

  const handleToggleWatchlist = () => {
    if (!movieId) return;
    
    if (isInWatchlist) {
      removeFromWatchlistMutation.mutate(movieId);
    } else {
      addToWatchlistMutation.mutate(movieId);
    }
  };

  const handleOpenTrailer = () => {
    if (!movie || !movie.videos || !movie.videos.results.length) {
      toast({
        title: "No Trailer Available",
        description: "Sorry, no trailer is available for this movie.",
      });
      return;
    }

    const trailer = movie.videos.results.find(
      (video) =>
        video.site === "YouTube" &&
        (video.type === "Trailer" || video.type === "Teaser")
    );

    if (!trailer) {
      toast({
        title: "No Trailer Available",
        description: "Sorry, no trailer is available for this movie.",
      });
      return;
    }

    window.open(`https://www.youtube.com/watch?v=${trailer.key}`, "_blank");
  };

  const formatRuntime = (minutes?: number) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        {isLoading && (
          <div className="flex justify-center items-center h-96">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && (
          <div className="flex flex-col justify-center items-center h-96 p-6">
            <h3 className="text-xl font-bold mb-4">Error Loading Movie</h3>
            <p className="text-muted-foreground mb-6">
              We couldn't load the movie details. Please try again later.
            </p>
            <Button onClick={onClose}>Close</Button>
          </div>
        )}

        {movie && (
          <ScrollArea className="max-h-[90vh]">
            {/* Movie Header/Background */}
            <div
              className="relative h-[200px] md:h-[300px] bg-cover bg-center"
              style={{
                backgroundImage: `url(${getBackdropUrl(movie.backdrop_path)})`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-foreground/80 hover:text-foreground bg-background/50 hover:bg-background/70 rounded-full"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Movie Content */}
            <div className="px-6 py-6 md:px-8 md:py-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Poster and Actions */}
                <div className="flex-none w-full md:w-[200px]">
                  <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden md:mb-4">
                    <img
                      src={getPosterUrl(movie.poster_path)}
                      alt={`${movie.title} poster`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="hidden md:flex flex-col gap-3 mt-4">
                    <Button
                      className="w-full"
                      onClick={handleOpenTrailer}
                    >
                      <Play className="mr-2 h-4 w-4" /> Watch Trailer
                    </Button>
                    <Button
                      variant={isInWatchlist ? "outline" : "secondary"}
                      className="w-full"
                      onClick={handleToggleWatchlist}
                    >
                      {isInWatchlist ? (
                        <>
                          <BookmarkCheck className="mr-2 h-4 w-4" /> In Watchlist
                        </>
                      ) : (
                        <>
                          <Bookmark className="mr-2 h-4 w-4" /> Add to Watchlist
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Movie Details */}
                <div className="flex-1">
                  <h2 className="font-bold text-2xl md:text-3xl">{movie.title}</h2>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {movie.release_date && (
                      <span className="bg-muted px-2 py-1 rounded text-sm">
                        {new Date(movie.release_date).getFullYear()}
                      </span>
                    )}
                    {movie.adult ? (
                      <span className="bg-muted px-2 py-1 rounded text-sm">
                        R
                      </span>
                    ) : (
                      <span className="bg-muted px-2 py-1 rounded text-sm">
                        PG-13
                      </span>
                    )}
                    <span className="bg-muted px-2 py-1 rounded text-sm">
                      {formatRuntime(movie.runtime)}
                    </span>
                    <div className="flex items-center bg-muted px-2 py-1 rounded">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="font-mono">
                        {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Action Buttons */}
                  <div className="flex md:hidden gap-3 mt-4">
                    <Button
                      className="flex-1"
                      onClick={handleOpenTrailer}
                    >
                      <Play className="mr-2 h-4 w-4" /> Trailer
                    </Button>
                    <Button
                      variant={isInWatchlist ? "outline" : "secondary"}
                      className="flex-1"
                      onClick={handleToggleWatchlist}
                    >
                      {isInWatchlist ? (
                        <BookmarkCheck className="h-4 w-4" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Genres */}
                  <div className="mt-4">
                    <h3 className="font-medium text-muted-foreground mb-2">Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {movie.genres?.map((genre) => (
                        <span
                          key={genre.id}
                          className="bg-muted px-3 py-1 rounded-full text-sm"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Overview */}
                  <div className="mt-6">
                    <h3 className="font-medium text-muted-foreground mb-2">Overview</h3>
                    <p className="text-foreground/80">{movie.overview}</p>
                  </div>

                  {/* Cast */}
                  {movie.credits?.cast && movie.credits.cast.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-medium text-muted-foreground mb-2">Cast</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {movie.credits.cast.slice(0, 8).map((actor) => (
                          <div key={actor.id} className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-none">
                              {actor.profile_path ? (
                                <img
                                  src={`https://image.tmdb.org/t/p/w92${actor.profile_path}`}
                                  alt={actor.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                                  {actor.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm line-clamp-1">{actor.name}</p>
                              <p className="text-muted-foreground text-xs line-clamp-1">
                                {actor.character}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rating Section */}
                  <div className="mt-8 border-t border-border pt-6">
                    <h3 className="font-medium mb-3">Rate This Movie</h3>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Button
                          key={star}
                          variant="ghost"
                          size="icon"
                          className={`text-2xl p-0 ${
                            userRating && star <= userRating
                              ? "text-yellow-500"
                              : "text-muted-foreground hover:text-yellow-500"
                          }`}
                          onClick={() => handleRateMovie(star)}
                        >
                          <Star className="h-6 w-6" />
                        </Button>
                      ))}
                      {userRating && (
                        <span className="ml-2 text-lg font-mono">
                          {userRating}.0
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Similar Movies */}
              {similarMovies && similarMovies.length > 0 && (
                <div className="mt-10">
                  <h3 className="font-medium text-xl mb-4">Similar Movies</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {similarMovies.slice(0, 5).map((movie) => (
                      <div
                        key={movie.id}
                        className="group cursor-pointer"
                        onClick={() => {
                          if (movieId !== movie.id) {
                            queryClient.invalidateQueries({ queryKey: ["/api/movies", movie.id] });
                            queryClient.invalidateQueries({ queryKey: ["/api/movies", movie.id, "similar"] });
                            queryClient.invalidateQueries({ queryKey: ["/api/user/ratings", movie.id] });
                            queryClient.invalidateQueries({ queryKey: ["/api/user/watchlist/check", movie.id] });
                          }
                        }}
                      >
                        <div className="rounded-lg overflow-hidden bg-muted aspect-[2/3] transform transition-transform group-hover:scale-105">
                          <img
                            src={getPosterUrl(movie.poster_path, "w342")}
                            alt={`${movie.title} poster`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <h4 className="text-sm mt-2 font-medium line-clamp-1">
                          {movie.title}
                        </h4>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
