import { useState } from "react";
import { Star, Info, Bookmark, BookmarkCheck } from "lucide-react";
import { Movie } from "@shared/schema";
import { getPosterUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface MovieCardProps {
  movie: Movie;
  onViewDetails: (movie: Movie) => void;
  isInWatchlist?: boolean;
  showWatchlistButton?: boolean;
}

export default function MovieCard({
  movie,
  onViewDetails,
  isInWatchlist = false,
  showWatchlistButton = true,
}: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(isInWatchlist);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addToWatchlistMutation = useMutation({
    mutationFn: api.addToWatchlist,
    onSuccess: () => {
      setInWatchlist(true);
      queryClient.invalidateQueries({ queryKey: ['/api/user/watchlist'] });
      toast({
        title: "Added to Watchlist",
        description: `${movie.title} has been added to your watchlist.`,
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

  const removeFromWatchlistMutation = useMutation({
    mutationFn: api.removeFromWatchlist,
    onSuccess: () => {
      setInWatchlist(false);
      queryClient.invalidateQueries({ queryKey: ['/api/user/watchlist'] });
      toast({
        title: "Removed from Watchlist",
        description: `${movie.title} has been removed from your watchlist.`,
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

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWatchlist) {
      removeFromWatchlistMutation.mutate(movie.id);
    } else {
      addToWatchlistMutation.mutate(movie.id);
    }
  };

  // Format genres for display
  const genreNames = movie.genres?.map(g => g.name) || [];

  return (
    <div
      className="group relative rounded-lg overflow-hidden bg-card h-[300px] transform transition-transform hover:scale-105 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewDetails(movie)}
    >
      <img
        src={getPosterUrl(movie.poster_path)}
        alt={`${movie.title} poster`}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div
        className={`absolute inset-0 bg-gradient-to-t from-background to-transparent 
          ${isHovered ? "opacity-100" : "opacity-0"} 
          flex flex-col justify-end p-4 transition-opacity`}
      >
        <h3 className="font-bold text-lg line-clamp-2">{movie.title}</h3>
        <div className="flex items-center mt-1">
          <Star className="h-4 w-4 text-yellow-500 mr-1" />
          <span className="font-mono text-sm">
            {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
          </span>
        </div>
        <div className="flex gap-1 mt-2 flex-wrap">
          {genreNames.length > 0 ? (
            genreNames.slice(0, 2).map((genre) => (
              <span
                key={genre}
                className="text-xs bg-card px-2 py-0.5 rounded-full"
              >
                {genre}
              </span>
            ))
          ) : (
            movie.genre_ids?.slice(0, 2).map((id) => (
              <span
                key={id}
                className="text-xs bg-card px-2 py-0.5 rounded-full"
              >
                ID: {id}
              </span>
            ))
          )}
        </div>
        <Button
          variant="default"
          className="mt-3 w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium py-1.5 rounded-md flex items-center justify-center"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(movie);
          }}
        >
          <Info className="h-4 w-4 mr-1" /> Details
        </Button>
      </div>
      
      {/* Watchlist Button */}
      {showWatchlistButton && (
        <button
          className="absolute top-2 right-2 p-2 bg-background/50 hover:bg-background rounded-full text-foreground/80 hover:text-primary transition-colors"
          onClick={handleToggleWatchlist}
          title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
        >
          {inWatchlist ? (
            <BookmarkCheck className="h-4 w-4 text-primary" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}
