import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Help Center</h1>
          <p className="text-muted-foreground mb-8">
            Find answers to common questions about using MoviePick's features and services.
          </p>

          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Browse our most common questions and answers</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>How does the recommendation system work?</AccordionTrigger>
                    <AccordionContent>
                      MoviePick's recommendation system analyzes your viewing history, ratings, and watchlist to suggest movies 
                      tailored to your preferences. The more movies you rate and add to your watchlist, the more personalized your 
                      recommendations become.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>How do I create a watchlist?</AccordionTrigger>
                    <AccordionContent>
                      To add a movie to your watchlist, simply click the bookmark icon on any movie card or movie detail page. 
                      You can view your complete watchlist by clicking on "Watchlist" in the navigation menu or your profile.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>How do I rate movies?</AccordionTrigger>
                    <AccordionContent>
                      You can rate movies by clicking on the star icon on movie cards or using the rating section on the movie 
                      detail page. Ratings are on a scale of 1-10, with 10 being the highest. Your ratings help improve your 
                      personalized recommendations.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>Can I reset my password?</AccordionTrigger>
                    <AccordionContent>
                      Yes, you can reset your password by going to the login page and clicking on "Reset Password." You'll need 
                      to enter your username and email address, and then follow the instructions to create a new password.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5">
                    <AccordionTrigger>What is the MovieLens dataset?</AccordionTrigger>
                    <AccordionContent>
                      MoviePick is powered by the MovieLens dataset, which contains a comprehensive collection of movie data including
                      titles, genres, release dates, and other metadata. This dataset allows us to provide detailed information and 
                      intelligent recommendations without relying on external APIs.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Getting Started Guide</CardTitle>
                <CardDescription>New to MoviePick? Learn how to make the most of our features</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal pl-5 space-y-4">
                  <li>
                    <h3 className="font-medium">Create an account</h3>
                    <p className="text-muted-foreground">Register with a username, optional name, and password to unlock personalized features.</p>
                  </li>
                  <li>
                    <h3 className="font-medium">Explore the movie collection</h3>
                    <p className="text-muted-foreground">Browse popular and top-rated films or use the search and filters to find specific titles.</p>
                  </li>
                  <li>
                    <h3 className="font-medium">Rate movies you've watched</h3>
                    <p className="text-muted-foreground">Add ratings to movies you've seen to help improve your recommendations.</p>
                  </li>
                  <li>
                    <h3 className="font-medium">Build your watchlist</h3>
                    <p className="text-muted-foreground">Save movies you want to watch later to your personal watchlist.</p>
                  </li>
                  <li>
                    <h3 className="font-medium">Discover personalized recommendations</h3>
                    <p className="text-muted-foreground">Visit your homepage to see movie suggestions tailored to your taste.</p>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>Need additional help? Reach out to our team</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  If you couldn't find the answer to your question in our FAQ or Getting Started Guide, please visit our 
                  <a href="/contact" className="text-primary hover:underline ml-1">Contact page</a> to get in touch with our support team.
                </p>
                <p className="text-muted-foreground">
                  Our support team is available Monday through Friday, 9 AM to 5 PM EST.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}