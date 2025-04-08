import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import {
  Edit,
  Trash2,
  ArrowLeft,
  Globe,
  Lock,
  Plus,
  AlignJustify,
  X,
  Check,
  PencilLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import * as api from "@/lib/api";
import { Movie, PlaylistItem, UserPlaylist, EnhancedPlaylistItem } from "@shared/schema";
import { getPosterUrl } from "@/lib/api";
import MovieDetailModal from "@/components/movie-detail-modal";

function PlaylistDetailPage() {
  const [, params] = useRoute<{ id: string }>("/playlist/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [isAddMovieDialogOpen, setIsAddMovieDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNotes, setEditingNotes] = useState<{
    playlistId: number;
    movieId: number;
    notes: string;
  } | null>(null);

  // If no playlistId, redirect to playlists page
  if (!params?.id) {
    navigate("/playlists");
    return null;
  }

  const playlistId = parseInt(params.id, 10);

  // Fetch playlist details
  const {
    data: playlist,
    isLoading: playlistLoading,
    error: playlistError,
  } = useQuery({
    queryKey: [`/api/playlists/${playlistId}`],
    queryFn: () => api.getPlaylist(playlistId),
  });

  // Fetch playlist items
  const {
    data: playlistItems,
    isLoading: playlistItemsLoading,
    error: playlistItemsError,
  } = useQuery<EnhancedPlaylistItem[]>({
    queryKey: [`/api/playlists/${playlistId}/items`],
    queryFn: () => api.getPlaylistItems(playlistId),
  });

  // Search movies for adding to playlist
  const {
    data: searchResults,
    isLoading: searchLoading,
    error: searchError,
  } = useQuery<Movie[]>({
    queryKey: ["/api/movies/search", searchQuery],
    queryFn: () => api.searchMovies(searchQuery),
    enabled: isAddMovieDialogOpen && searchQuery.length > 2,
  });

  // Add movie to playlist mutation
  const addMovieMutation = useMutation({
    mutationFn: ({
      movieId,
      notes,
    }: {
      movieId: number;
      notes?: string;
    }) => api.addMovieToPlaylist(playlistId, movieId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/playlists/${playlistId}/items`],
      });
      toast({
        title: "Movie Added",
        description: "The movie has been added to your playlist.",
      });
      setIsAddMovieDialogOpen(false);
      setSearchQuery("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add movie to playlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove movie from playlist mutation
  const removeMovieMutation = useMutation({
    mutationFn: (movieId: number) =>
      api.removeMovieFromPlaylist(playlistId, movieId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/playlists/${playlistId}/items`],
      });
      toast({
        title: "Movie Removed",
        description: "The movie has been removed from your playlist.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove movie from playlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: ({
      movieId,
      notes,
    }: {
      movieId: number;
      notes: string;
    }) => api.updatePlaylistItemNotes(playlistId, movieId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/playlists/${playlistId}/items`],
      });
      toast({
        title: "Notes Updated",
        description: "Your notes have been updated.",
      });
      setEditingNotes(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update notes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle movie search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle adding a movie to the playlist
  const handleAddMovie = (movie: Movie) => {
    addMovieMutation.mutate({ movieId: movie.id });
  };

  // Handle removing a movie from the playlist
  const handleRemoveMovie = (movieId: number) => {
    if (confirm("Are you sure you want to remove this movie from the playlist?")) {
      removeMovieMutation.mutate(movieId);
    }
  };

  // Check if a movie is already in the playlist
  const isMovieInPlaylist = (movieId: number) => {
    return playlistItems?.some((item) => item.movieId === movieId) || false;
  };

  // Handle updating notes
  const handleUpdateNotes = () => {
    if (editingNotes) {
      updateNotesMutation.mutate({
        movieId: editingNotes.movieId,
        notes: editingNotes.notes,
      });
    }
  };

  // Handle canceling notes edit
  const handleCancelNotesEdit = () => {
    setEditingNotes(null);
  };

  // Find item notes
  const findItemNotes = (movieId: number) => {
    return playlistItems?.find((item) => item.movieId === movieId)?.notes || "";
  };

  // Start editing notes for a movie
  const startEditingNotes = (movieId: number) => {
    setEditingNotes({
      playlistId,
      movieId,
      notes: findItemNotes(movieId),
    });
  };

  if (playlistLoading || playlistItemsLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-center">
          <LoadingSpinner className="h-8 w-8" />
        </main>
        <Footer />
      </div>
    );
  }

  if (playlistError || !playlist) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Error Loading Playlist</h1>
            <p className="mt-2">The playlist could not be found or you don't have permission to view it.</p>
            <Button onClick={() => navigate("/playlists")} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Playlists
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto"
              onClick={() => navigate("/playlists")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Playlists
            </Button>
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{playlist.name}</h1>
                {playlist.isPublic ? (
                  <Globe className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              {playlist.description && (
                <p className="text-muted-foreground mt-1">{playlist.description}</p>
              )}
            </div>
            <Button
              onClick={() => setIsAddMovieDialogOpen(true)}
              className="shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Movies
            </Button>
          </div>
        </div>

        {playlistItems?.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">This playlist is empty</h2>
            <p className="text-muted-foreground mb-4">
              Start building your collection by adding movies to this playlist.
            </p>
            <Button onClick={() => setIsAddMovieDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Movies
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {playlistItems?.map((item) => (
              <Card
                key={`${item.playlistId}-${item.movieId}`}
                className="overflow-hidden flex flex-col h-full"
              >
                <div className="relative aspect-[2/3] overflow-hidden bg-muted">
                  <img
                    src={getPosterUrl(item.movie?.poster_path || null)}
                    alt={item.movie?.title}
                    className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
                    onClick={() => setSelectedMovieId(item.movieId)}
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 
                      className="font-semibold line-clamp-2 cursor-pointer hover:text-primary"
                      onClick={() => setSelectedMovieId(item.movieId)}
                    >
                      {item.movie?.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveMovie(item.movieId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {item.notes ? (
                    <div className="flex-1 bg-muted/30 rounded p-2 text-sm relative group">
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => startEditingNotes(item.movieId)}
                        >
                          <PencilLine className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="line-clamp-4 text-muted-foreground">{item.notes}</p>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs justify-start px-2 h-auto py-1 text-muted-foreground"
                      onClick={() => startEditingNotes(item.movieId)}
                    >
                      <PencilLine className="h-3 w-3 mr-1" /> Add notes
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add Movies Dialog */}
        <Dialog
          open={isAddMovieDialogOpen}
          onOpenChange={setIsAddMovieDialogOpen}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add Movies to Playlist</DialogTitle>
              <DialogDescription>
                Search for movies to add to "{playlist.name}"
              </DialogDescription>
            </DialogHeader>

            <div className="relative">
              <input
                type="text"
                placeholder="Search for movies..."
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <ScrollArea className="h-96">
              {searchQuery.length > 2 ? (
                searchLoading ? (
                  <div className="flex justify-center py-10">
                    <LoadingSpinner />
                  </div>
                ) : searchError ? (
                  <div className="text-center py-10 text-destructive">
                    Failed to load search results. Please try again.
                  </div>
                ) : searchResults?.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    No movies found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2">
                    {searchResults?.map((movie: Movie) => {
                      const alreadyInPlaylist = isMovieInPlaylist(movie.id);
                      return (
                        <Card
                          key={movie.id}
                          className="flex overflow-hidden h-24"
                        >
                          <div className="h-full w-16 shrink-0 bg-muted">
                            <img
                              src={getPosterUrl(movie.poster_path || null)}
                              alt={movie.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex flex-1 justify-between items-center p-3">
                            <div className="overflow-hidden">
                              <h4 className="font-semibold text-sm line-clamp-1">
                                {movie.title}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {movie.release_date?.substring(0, 4) || "N/A"}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant={alreadyInPlaylist ? "outline" : "default"}
                              disabled={alreadyInPlaylist}
                              onClick={() => handleAddMovie(movie)}
                            >
                              {alreadyInPlaylist ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" /> Added
                                </>
                              ) : (
                                "Add"
                              )}
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  Type at least 3 characters to search for movies
                </div>
              )}
            </ScrollArea>

            <DialogFooter>
              <DialogClose asChild>
                <Button>Done</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Notes Sheet */}
        {editingNotes && (
          <Sheet
            open={!!editingNotes}
            onOpenChange={(open) => {
              if (!open) setEditingNotes(null);
            }}
          >
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Edit Notes</SheetTitle>
                <SheetDescription>
                  Add your personal notes about this movie
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <Textarea
                  value={editingNotes.notes}
                  onChange={(e) =>
                    setEditingNotes({
                      ...editingNotes,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Write your notes here..."
                  className="min-h-[200px]"
                />
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline" onClick={handleCancelNotesEdit}>
                    Cancel
                  </Button>
                </SheetClose>
                <Button onClick={handleUpdateNotes}>
                  {updateNotesMutation.isPending && (
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                  )}
                  Save Notes
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        )}

        {/* Movie Detail Modal */}
        {selectedMovieId && (
          <MovieDetailModal
            movieId={selectedMovieId}
            isOpen={selectedMovieId !== null}
            onClose={() => setSelectedMovieId(null)}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default PlaylistDetailPage;