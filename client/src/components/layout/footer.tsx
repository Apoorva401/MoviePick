import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-muted py-8 mt-8 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">MoviePick</h3>
            <p className="text-muted-foreground text-sm">
              Films Handpicked Just for You
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Discover</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/discover" className="text-muted-foreground hover:text-foreground transition-colors">
                  Popular
                </Link>
              </li>
              <li>
                <Link href="/discover" className="text-muted-foreground hover:text-foreground transition-colors">
                  Top Rated
                </Link>
              </li>
              <li>
                <Link href="/discover" className="text-muted-foreground hover:text-foreground transition-colors">
                  Upcoming
                </Link>
              </li>
              <li>
                <Link href="/discover" className="text-muted-foreground hover:text-foreground transition-colors">
                  Now Playing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
                  Profile
                </Link>
              </li>
              <li>
                <Link href="/watchlist" className="text-muted-foreground hover:text-foreground transition-colors">
                  Watchlist
                </Link>
              </li>
              <li>
                <Link href="/rated" className="text-muted-foreground hover:text-foreground transition-colors">
                  Ratings
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help-center" className="text-muted-foreground hover:text-foreground transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/terms-of-use" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-6 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} MoviePick. All rights reserved. Powered by the MovieLens Dataset.</p>
        </div>
      </div>
    </footer>
  );
}
