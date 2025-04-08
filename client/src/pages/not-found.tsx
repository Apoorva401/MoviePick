import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="flex flex-col items-center mb-6">
              <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              <h1 className="text-3xl font-bold">404 Page Not Found</h1>
              <p className="mt-4 text-muted-foreground">
                Sorry, the page you are looking for doesn't exist or has been moved.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Link href="/">
              <Button className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Return to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
