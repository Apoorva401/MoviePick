import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Plus,
  Film,
  MoreHorizontal,
  Edit,
  Trash2,
  Globe,
  Lock,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import * as api from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { UserPlaylist } from "@shared/schema";

// Schema for playlist creation/editing
const playlistSchema = z.object({
  name: z.string().min(1, "Playlist name is required").max(50, "Name must be less than 50 characters"),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
  isPublic: z.boolean().default(false),
});

type PlaylistFormValues = z.infer<typeof playlistSchema>;

function PlaylistsPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<UserPlaylist | null>(null);
  const [activeTab, setActiveTab] = useState("my-playlists");

  // Fetch user playlists
  const {
    data: userPlaylists,
    isLoading: userPlaylistsLoading,
    error: userPlaylistsError,
  } = useQuery({
    queryKey: ["/api/playlists"],
    queryFn: api.getUserPlaylists,
  });

  // Fetch public playlists
  const {
    data: publicPlaylists,
    isLoading: publicPlaylistsLoading,
    error: publicPlaylistsError,
  } = useQuery({
    queryKey: ["/api/playlists/public"],
    queryFn: api.getPublicPlaylists,
  });

  // Create playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: api.createPlaylist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      toast({
        title: "Playlist Created",
        description: "Your playlist has been created successfully.",
      });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create playlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update playlist mutation
  const updatePlaylistMutation = useMutation({
    mutationFn: ({ playlistId, updates }: { playlistId: number; updates: Partial<PlaylistFormValues> }) =>
      api.updatePlaylist(playlistId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/playlists/public"] });
      toast({
        title: "Playlist Updated",
        description: "Your playlist has been updated successfully.",
      });
      setEditingPlaylist(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update playlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete playlist mutation
  const deletePlaylistMutation = useMutation({
    mutationFn: api.deletePlaylist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/playlists/public"] });
      toast({
        title: "Playlist Deleted",
        description: "The playlist has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete playlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form for creating/editing playlists
  const form = useForm<PlaylistFormValues>({
    resolver: zodResolver(playlistSchema),
    defaultValues: {
      name: editingPlaylist?.name || "",
      description: editingPlaylist?.description || "",
      isPublic: editingPlaylist?.isPublic || false,
    },
  });

  // Reset form when editing playlist changes
  useState(() => {
    if (editingPlaylist) {
      form.reset({
        name: editingPlaylist.name,
        description: editingPlaylist.description || "",
        isPublic: editingPlaylist.isPublic,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        isPublic: false,
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: PlaylistFormValues) => {
    if (editingPlaylist) {
      updatePlaylistMutation.mutate({
        playlistId: editingPlaylist.id,
        updates: values,
      });
    } else {
      createPlaylistMutation.mutate(values);
    }
  };

  // Handle Delete confirmation
  const handleDeletePlaylist = (playlistId: number) => {
    if (confirm("Are you sure you want to delete this playlist? This action cannot be undone.")) {
      deletePlaylistMutation.mutate(playlistId);
    }
  };

  // Render playlists in a grid
  const renderPlaylists = (playlists: UserPlaylist[], isOwner: boolean = true) => {
    if (!playlists || playlists.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">
            {isOwner
              ? "You haven't created any playlists yet."
              : "No public playlists available."}
          </p>
          {isOwner && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Playlist
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.map((playlist) => (
          <Card key={playlist.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="line-clamp-1">{playlist.name}</CardTitle>
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingPlaylist(playlist)}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit Playlist
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeletePlaylist(playlist.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Playlist
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                {playlist.isPublic ? (
                  <Globe className="h-3 w-3 mr-1" />
                ) : (
                  <Lock className="h-3 w-3 mr-1" />
                )}
                {playlist.isPublic ? "Public" : "Private"}
                {playlist.createdAt && (
                  <span className="mx-1">•</span>
                )}
                {playlist.createdAt && (
                  <span>
                    {new Date(playlist.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              {playlist.description && (
                <CardDescription className="line-clamp-2 mt-1">
                  {playlist.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex items-center text-sm">
                <Film className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  {playlist._count?.items ?? 0} {playlist._count?.items === 1 ? "movie" : "movies"}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/playlist/${playlist.id}`)}
              >
                <ExternalLink className="h-4 w-4 mr-2" /> View Playlist
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  const handleNewPlaylist = () => {
    setEditingPlaylist(null);
    form.reset({
      name: "",
      description: "",
      isPublic: false,
    });
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Movie Playlists</h1>
            <p className="text-muted-foreground mt-1">
              Create and explore curated collections of your favorite films
            </p>
          </div>
          <Button onClick={handleNewPlaylist}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Playlist
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="my-playlists">My Playlists</TabsTrigger>
            <TabsTrigger value="public-playlists">Public Playlists</TabsTrigger>
          </TabsList>

          <TabsContent value="my-playlists">
            {userPlaylistsLoading ? (
              <div className="flex justify-center py-10">
                <LoadingSpinner />
              </div>
            ) : userPlaylistsError ? (
              <div className="text-center py-10 text-destructive">
                Failed to load playlists. Please try again.
              </div>
            ) : (
              renderPlaylists(userPlaylists || [])
            )}
          </TabsContent>

          <TabsContent value="public-playlists">
            {publicPlaylistsLoading ? (
              <div className="flex justify-center py-10">
                <LoadingSpinner />
              </div>
            ) : publicPlaylistsError ? (
              <div className="text-center py-10 text-destructive">
                Failed to load public playlists. Please try again.
              </div>
            ) : (
              renderPlaylists(publicPlaylists || [], false)
            )}
          </TabsContent>
        </Tabs>

        {/* Create/Edit Playlist Dialog */}
        <Dialog
          open={isCreateDialogOpen || editingPlaylist !== null}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              setEditingPlaylist(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPlaylist ? "Edit Playlist" : "Create New Playlist"}
              </DialogTitle>
              <DialogDescription>
                {editingPlaylist
                  ? "Update your playlist details below."
                  : "Create a new collection for your favorite movies."}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Playlist Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter playlist name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add a description (optional)"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Briefly describe your playlist in a few sentences.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Make Public</FormLabel>
                        <FormDescription>
                          Public playlists can be viewed by anyone
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter className="gap-2 sm:gap-0">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={
                      createPlaylistMutation.isPending ||
                      updatePlaylistMutation.isPending
                    }
                  >
                    {(createPlaylistMutation.isPending ||
                      updatePlaylistMutation.isPending) && (
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                    )}
                    {editingPlaylist ? "Update Playlist" : "Create Playlist"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}

export default PlaylistsPage;