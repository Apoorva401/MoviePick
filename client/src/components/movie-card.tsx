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
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : "";

  return (
    <div
      className="group relative rounded-lg overflow-hidden bg-card shadow-md hover:shadow-xl transform transition-all duration-300 hover:scale-[1.02] cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewDetails(movie)}
    >
      {/* Poster Image with Gradient Overlay */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={getPosterUrl(movie.poster_path)}
          alt={`${movie.title} poster`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-70 transition-opacity" />
        
        {/* Rating Badge */}
        <div className="absolute top-2 left-2 flex items-center bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full">
          <Star className="h-3.5 w-3.5 text-yellow-400 mr-1" />
          <span className="font-mono text-xs font-medium">
            {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
          </span>
        </div>
        
        {/* Year Badge */}
        {releaseYear && (
          <div className="absolute top-2 right-10 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full">
            <span className="text-xs font-medium">{releaseYear}</span>
          </div>
        )}
        
        {/* Watchlist Button */}
        {showWatchlistButton && (
          <button
            className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm hover:bg-primary/80 rounded-full text-white transition-colors duration-200"
            onClick={handleToggleWatchlist}
            title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
          >
            {inWatchlist ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </button>
        )}
        
        {/* Hover Details Overlay */}
        <div 
          className={`absolute inset-0 flex flex-col justify-end p-3
            transition-all duration-300 bg-gradient-to-t from-black/90 via-black/60 to-transparent
            ${isHovered ? "opacity-100" : "opacity-0"}`}
        >
          <div className="flex gap-1 mb-2 flex-wrap">
            {genreNames.length > 0 ? (
              genreNames.slice(0, 2).map((genre) => (
                <span
                  key={genre}
                  className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-white"
                >
                  {genre}
                </span>
              ))
            ) : (
              movie.genre_ids?.slice(0, 2).map((id) => (
                <span
                  key={id}
                  className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-white"
                >
                  ID: {id}
                </span>
              ))
            )}
          </div>
          
          <p className="text-xs text-white/80 line-clamp-2 mb-2">{movie.overview}</p>
          
          <Button
            variant="default"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium py-1 rounded-md flex items-center justify-center"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(movie);
            }}
          >
            <Info className="h-3.5 w-3.5 mr-1" /> View Details
          </Button>
        </div>
      </div>
      
      {/* Movie Title & Info Below Poster */}
      <div className="p-2 bg-card">
        <h3 className="font-medium text-sm line-clamp-1">{movie.title}</h3>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center">
            <Star className="h-3 w-3 text-yellow-500 mr-1" />
            <span className="text-xs text-muted-foreground">
              {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{releaseYear}</span>
        </div>
      </div>
    </div>
  );
}
