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

  return (
    <div className="flex bg-card rounded-lg overflow-hidden h-[180px]">
      <img
        src={getPosterUrl(movie.poster_path, "w200")}
        alt={`${movie.title} poster`}
        className="w-[120px] object-cover"
        loading="lazy"
      />
      <div className="flex flex-col p-4 flex-1 justify-between">
        <div>
          <h3 className="font-bold text-lg line-clamp-1">{movie.title}</h3>
          <p className="text-muted-foreground text-sm">
            {releaseYear}
            {genreText && ` • ${genreText}`}
          </p>
          <p className="text-foreground/80 text-sm mt-2 line-clamp-2">
            {movie.overview}
          </p>
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
            onClick={() => onViewDetails(movie)}
          >
            <Info className="h-4 w-4 mr-1" /> Details
          </Button>
        </div>
      </div>
    </div>
  );
}
