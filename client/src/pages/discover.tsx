import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Filter,
  Star,
  ChevronDown,
  SlidersHorizontal,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieCard from "@/components/movie-card";
import MovieDetailModal from "@/components/movie-detail-modal";
import * as api from "@/lib/api";
import { Movie, Genre } from "@shared/schema";

export default function Discover() {
  const [location] = useLocation();
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Parse query param on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    if (query) {
      setSearchQuery(query);
    }
  }, [location]);

  // Fetch genres
  const { data: genres } = useQuery({
    queryKey: ["/api/genres"],
    queryFn: api.getGenres,
  });

  // Fetch movies based on search query, genres, etc.
  const {
    data: movies,
    isLoading: loadingMovies,
    refetch,
  } = useQuery({
    queryKey: ["/api/movies/search", searchQuery, selectedGenreIds, sortBy, currentPage],
    queryFn: async () => {
      if (searchQuery) {
        return api.searchMovies(searchQuery, currentPage);
      } else if (selectedGenreIds.length > 0) {
        // For simplicity, we'll just use the first selected genre
        return api.getMoviesByGenre(selectedGenreIds[0], currentPage);
      } else {
        // Default to popular movies if no search or genre filter
        return sortBy === "top_rated"
          ? api.getTopRatedMovies(currentPage)
          : api.getPopularMovies(currentPage);
      }
    },
  });

  // Handle genre selection
  const handleGenreSelect = (genreId: number) => {
    setSelectedGenreIds((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };

  // Handle sort selection
  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedGenreIds([]);
    setSortBy("popularity");
    setCurrentPage(1);
  };

  // Handle movie details view
  const handleViewMovieDetails = (movie: Movie) => {
    setSelectedMovieId(movie.id);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            {searchQuery
              ? `Search Results: ${searchQuery}`
              : selectedGenreIds.length > 0
              ? "Movies by Genre"
              : "Discover Movies"}
          </h1>

          <div className="flex items-center gap-2">
            {/* Mobile Filter Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <h3 className="font-medium mb-2">Sort By</h3>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant={sortBy === "popularity" ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => handleSortChange("popularity")}
                    >
                      Popularity
                    </Button>
                    <Button
                      variant={sortBy === "top_rated" ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => handleSortChange("top_rated")}
                    >
                      Top Rated
                    </Button>
                  </div>

                  <h3 className="font-medium mb-2 mt-6">Genres</h3>
                  <ScrollArea className="h-[300px]">
                    <div className="flex flex-col gap-2">
                      {genres?.map((genre: Genre) => (
                        <Button
                          key={genre.id}
                          variant={
                            selectedGenreIds.includes(genre.id)
                              ? "default"
                              : "outline"
                          }
                          className="justify-start"
                          onClick={() => handleGenreSelect(genre.id)}
                        >
                          {genre.name}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button onClick={() => refetch()}>Apply Filters</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* Desktop Filter Controls */}
            <div className="hidden md:flex items-center gap-3">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Genres
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Select Genres</SheetTitle>
                  </SheetHeader>
                  <div className="py-4">
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="grid grid-cols-2 gap-2">
                        {genres?.map((genre: Genre) => (
                          <Button
                            key={genre.id}
                            variant={
                              selectedGenreIds.includes(genre.id)
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            className="justify-start h-auto py-2"
                            onClick={() => handleGenreSelect(genre.id)}
                          >
                            {genre.name}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  <SheetFooter>
                    <SheetClose asChild>
                      <Button onClick={() => refetch()}>Apply Filters</Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Sort By <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => handleSortChange("popularity")}
                    className="cursor-pointer"
                  >
                    Popularity
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSortChange("top_rated")}
                    className="cursor-pointer"
                  >
                    Top Rated
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {(searchQuery || selectedGenreIds.length > 0 || sortBy !== "popularity") && (
                <Button
                  variant="ghost"
                  onClick={handleClearFilters}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-1" /> Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Form */}
        <form onSubmit={handleSearch} className="mb-6 block md:hidden">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10"
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Active Filters Display */}
        {(searchQuery || selectedGenreIds.length > 0 || sortBy !== "popularity") && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <div className="bg-muted text-foreground px-3 py-1 rounded-full text-sm flex items-center">
                <span className="mr-1">Search: {searchQuery}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            {sortBy !== "popularity" && (
              <div className="bg-muted text-foreground px-3 py-1 rounded-full text-sm flex items-center">
                <span className="mr-1">
                  Sort: {sortBy === "top_rated" ? "Top Rated" : sortBy}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setSortBy("popularity")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            {selectedGenreIds.map((genreId) => {
              const genre = genres?.find((g) => g.id === genreId);
              return (
                genre && (
                  <div
                    key={genreId}
                    className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    <span className="mr-1">{genre.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1 text-primary-foreground hover:text-primary-foreground/80"
                      onClick={() => handleGenreSelect(genreId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground ml-auto hidden md:flex"
              onClick={handleClearFilters}
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Movies Grid */}
        {loadingMovies ? (
          <div className="h-96 flex justify-center items-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : movies && movies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onViewDetails={handleViewMovieDetails}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-10 flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant={currentPage === 1 ? "default" : "outline"}
                className="w-10"
                onClick={() => setCurrentPage(1)}
              >
                1
              </Button>
              {currentPage > 3 && <span className="self-center">...</span>}
              {currentPage > 2 && (
                <Button
                  variant="outline"
                  className="w-10"
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  {currentPage - 1}
                </Button>
              )}
              {currentPage > 1 && currentPage < 6 && (
                <Button variant="default" className="w-10">
                  {currentPage}
                </Button>
              )}
              {currentPage < 5 && (
                <Button
                  variant="outline"
                  className="w-10"
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  {currentPage + 1}
                </Button>
              )}
              {currentPage < 4 && (
                <Button
                  variant="outline"
                  className="w-10"
                  onClick={() => setCurrentPage(currentPage + 2)}
                >
                  {currentPage + 2}
                </Button>
              )}
              {currentPage < 3 && <span className="self-center">...</span>}
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold mb-2">No Movies Found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <Button onClick={handleClearFilters}>Clear All Filters</Button>
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
