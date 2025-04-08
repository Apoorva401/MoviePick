import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Discover from "@/pages/discover";
import Watchlist from "@/pages/watchlist";
import Rated from "@/pages/rated";
import Profile from "@/pages/profile";
import Playlists from "@/pages/playlists";
import PlaylistDetail from "@/pages/playlist-detail";
import HelpCenter from "@/pages/help-center";
import TermsOfUse from "@/pages/terms-of-use";
import PrivacyPolicy from "@/pages/privacy-policy";
import Contact from "@/pages/contact";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/discover" component={Discover} />
      <Route path="/watchlist" component={Watchlist} />
      <Route path="/rated" component={Rated} />
      <Route path="/playlists" component={Playlists} />
      <Route path="/playlist/:id" component={PlaylistDetail} />
      <Route path="/profile" component={Profile} />
      
      {/* Support Pages */}
      <Route path="/help-center" component={HelpCenter} />
      <Route path="/terms-of-use" component={TermsOfUse} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/contact" component={Contact} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
