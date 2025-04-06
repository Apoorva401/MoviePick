import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import * as api from "@/lib/api";
import { type Genre } from "@shared/schema";

interface GenreFiltersProps {
  selectedGenreIds: number[];
  onGenreSelect: (genreId: number) => void;
}

export default function GenreFilters({
  selectedGenreIds,
  onGenreSelect,
}: GenreFiltersProps) {
  const { data: genres, isLoading, error } = useQuery({
    queryKey: ["/api/genres"],
    queryFn: api.getGenres,
  });

  if (isLoading) {
    return (
      <div className="py-4">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (error || !genres) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        Unable to load genres. Please try again later.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-2 min-w-max">
        {genres.map((genre: Genre) => {
          const isSelected = selectedGenreIds.includes(genre.id);
          return (
            <Button
              key={genre.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={`flex-none rounded-full text-sm transition-colors 
                ${isSelected ? "bg-primary hover:bg-primary/90 border-primary" : "bg-background hover:bg-muted border-border"}`}
              onClick={() => onGenreSelect(genre.id)}
            >
              {genre.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
