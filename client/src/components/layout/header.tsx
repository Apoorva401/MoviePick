import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Search, User, Menu } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import useMobile from "@/hooks/use-mobile";

export default function Header() {
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [isSearching, setIsSearching] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useMobile();

  // Get current user
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/auth/me"],
    onError: () => {
      // We'll silence errors here since it might just mean the user isn't logged in
    },
    retry: false,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/");
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Something went wrong while logging out",
        variant: "destructive",
      });
    },
  });

  // Handle search
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      setIsSearching(true);
      navigate(`/discover?q=${encodeURIComponent(debouncedSearchQuery)}`);
    }
  }, [debouncedSearchQuery, navigate]);

  // Handle search input changes
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="sticky top-0 z-50 bg-background shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          {/* App Logo */}
          <Link href="/" className="flex items-center mr-8">
            <span className="text-primary font-bold text-2xl">MovieMatch</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link
              href="/"
              className={`font-medium hover:text-primary transition-colors ${
                isActive("/") ? "text-primary" : ""
              }`}
            >
              Home
            </Link>
            <Link
              href="/discover"
              className={`font-medium hover:text-primary transition-colors ${
                isActive("/discover") || location.includes("/discover")
                  ? "text-primary"
                  : ""
              }`}
            >
              Discover
            </Link>
            <Link
              href="/watchlist"
              className={`font-medium hover:text-primary transition-colors ${
                isActive("/watchlist") ? "text-primary" : ""
              }`}
            >
              Watchlist
            </Link>
            <Link
              href="/rated"
              className={`font-medium hover:text-primary transition-colors ${
                isActive("/rated") ? "text-primary" : ""
              }`}
            >
              Rated
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {/* Desktop Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative hidden md:block"
          >
            <Input
              type="text"
              placeholder="Search movies..."
              className="bg-muted border border-input rounded-full py-2 px-4 pr-10 focus:outline-none focus:border-primary w-56 lg:w-72"
              value={searchQuery}
              onChange={handleSearchInputChange}
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground h-5 w-5 p-0"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {/* Mobile Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px]">
              <SheetHeader className="mb-4">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-4">
                <Link
                  href="/"
                  className={`font-medium hover:text-primary transition-colors ${
                    isActive("/") ? "text-primary" : ""
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/discover"
                  className={`font-medium hover:text-primary transition-colors ${
                    isActive("/discover") ? "text-primary" : ""
                  }`}
                >
                  Discover
                </Link>
                <Link
                  href="/watchlist"
                  className={`font-medium hover:text-primary transition-colors ${
                    isActive("/watchlist") ? "text-primary" : ""
                  }`}
                >
                  Watchlist
                </Link>
                <Link
                  href="/rated"
                  className={`font-medium hover:text-primary transition-colors ${
                    isActive("/rated") ? "text-primary" : ""
                  }`}
                >
                  Rated
                </Link>
                <div className="border-t border-border pt-4">
                  {currentUser ? (
                    <>
                      <Link
                        href="/profile"
                        className="font-medium hover:text-primary transition-colors"
                      >
                        Profile
                      </Link>
                      <Button
                        variant="ghost"
                        className="mt-4 w-full justify-start p-0 hover:text-primary transition-colors"
                        onClick={() => logoutMutation.mutate()}
                      >
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Link
                      href="/profile"
                      className="font-medium hover:text-primary transition-colors"
                    >
                      Sign In
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* User Menu (Desktop) */}
          <div className="relative hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full focus:ring-0"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    {currentUser ? (
                      <span className="text-sm font-medium">
                        {currentUser.name?.[0] || currentUser.username?.[0] || "U"}
                      </span>
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {currentUser ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/watchlist" className="cursor-pointer">Watchlist</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/rated" className="cursor-pointer">Rated Movies</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => logoutMutation.mutate()}
                      className="cursor-pointer"
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">Sign In</Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      {showMobileSearch && (
        <form
          onSubmit={handleSearchSubmit}
          className="md:hidden px-4 py-3 bg-muted"
        >
          <div className="relative">
            <Input
              type="text"
              placeholder="Search movies..."
              className="w-full bg-card border border-input rounded-full py-2 px-4 focus:outline-none focus:border-primary"
              value={searchQuery}
              onChange={handleSearchInputChange}
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground h-5 w-5 p-0"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}
    </header>
  );
}
