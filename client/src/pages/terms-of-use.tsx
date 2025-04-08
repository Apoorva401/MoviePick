import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Terms of Use</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using MoviePick ("the Service"), you agree to be bound by these Terms of Use. If you do not 
              agree to these terms, please do not use the Service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              MoviePick is a movie recommendation platform that provides personalized film suggestions based on user preferences
              and behavior. The Service allows users to browse, search, rate, and bookmark movies from our catalogue.
            </p>

            <h2>3. User Accounts</h2>
            <p>
              To access certain features of the Service, you must create an account. You are responsible for maintaining the 
              confidentiality of your account information and for all activities that occur under your account. You agree to:
            </p>
            <ul>
              <li>Provide accurate and complete information when creating your account</li>
              <li>Update your information to keep it accurate and current</li>
              <li>Ensure your password remains secure and confidential</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>

            <h2>4. User Content</h2>
            <p>
              When you rate movies or contribute other content to the Service, you grant us a non-exclusive, worldwide, royalty-free
              license to use, reproduce, process, and display this content for the purpose of providing and improving the Service.
            </p>

            <h2>5. Prohibited Conduct</h2>
            <p>When using the Service, you agree not to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to any portion of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Scrape, data-mine, or otherwise extract data from the Service in an automated manner</li>
              <li>Share your account credentials with others</li>
            </ul>

            <h2>6. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned by MoviePick and are protected by 
              copyright, trademark, and other intellectual property laws. The MovieLens dataset used by the Service is governed
              by its own licensing terms.
            </p>

            <h2>7. Termination</h2>
            <p>
              We reserve the right to terminate or suspend your account and access to the Service at our sole discretion, without 
              notice, for conduct that we believe violates these Terms of Use or is harmful to other users of the Service, us, or 
              third parties, or for any other reason.
            </p>

            <h2>8. Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do 
              not guarantee that the Service will be uninterrupted, secure, or error-free.
            </p>

            <h2>9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, MoviePick shall not be liable for any indirect, incidental, special, 
              consequential, or punitive damages resulting from your use of or inability to use the Service.
            </p>

            <h2>10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms of Use at any time. We will provide notice of significant changes by 
              updating the "Last updated" date at the top of these terms. Your continued use of the Service after such changes 
              constitutes your acceptance of the new terms.
            </p>

            <h2>11. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Use, please contact us through our <a href="/contact" className="text-primary hover:underline">Contact page</a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}