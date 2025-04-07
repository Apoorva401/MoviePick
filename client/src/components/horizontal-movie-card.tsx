import { Info, Star } from "lucide-react";
import { Movie } from "@shared/schema";
import { getPosterUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface HorizontalMovieCardProps {
  movie: Movie;
  onViewDetails: (movie: Movie) => void;
}

export default function HorizontalMovieCard({
  movie,
  onViewDetails,
}: HorizontalMovieCardProps) {
  // Format the year from release date
  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "";

  // Format genres for display
  let genreText = "";
  if (movie.genres && movie.genres.length > 0) {
    genreText = movie.genres.map((g) => g.name).join(", ");
  }

  // Get runtime in hours and minutes format
  const formatRuntime = (minutes?: number) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  const runtime = formatRuntime(movie.runtime);

  return (
    <div className="flex bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-border/40">
      {/* Poster with overlay gradient */}
      <div className="relative w-[120px] min-w-[120px] overflow-hidden">
        <img
          src={getPosterUrl(movie.poster_path, "w200")}
          alt={`${movie.title} poster`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
        
        {/* Rating badge */}
        <div className="absolute bottom-2 left-2 flex items-center bg-black/60 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-md">
          <Star className="h-3 w-3 text-yellow-400 mr-1" />
          <span className="text-xs font-medium">
            {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex flex-col p-4 flex-1 justify-between">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-base sm:text-lg line-clamp-1">{movie.title}</h3>
            {releaseYear && (
              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">
                {releaseYear}
              </span>
            )}
          </div>
          
          {/* Movie metadata */}
          <div className="flex items-center flex-wrap gap-x-2 mt-1">
            {runtime && (
              <span className="text-xs text-muted-foreground">
                {runtime}
              </span>
            )}
            {genreText && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {genreText}
              </span>
            )}
          </div>
          
          {/* Overview */}
          <p className="text-foreground/80 text-xs sm:text-sm mt-2 line-clamp-2 sm:line-clamp-3">
            {movie.overview}
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center">
            <div className="flex items-center bg-muted/50 px-2 py-1 rounded-md">
              <Star className="h-3.5 w-3.5 text-yellow-500 mr-1" />
              <span className="font-mono text-xs font-medium">
                {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground ml-2">
              {movie.vote_count.toLocaleString()} votes
            </span>
          </div>
          <Button
            variant="default"
            size="sm"
            className="text-xs bg-primary hover:bg-primary/90"
            onClick={() => onViewDetails(movie)}
          >
            <Info className="h-3.5 w-3.5 mr-1" /> View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
