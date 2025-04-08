import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h2>1. Introduction</h2>
            <p>
              At MoviePick, we value your privacy and are committed to protecting your personal information. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our movie recommendation service.
            </p>
            <p>
              Please read this Privacy Policy carefully. By accessing or using MoviePick, you acknowledge that you have read, 
              understood, and agree to be bound by the terms described in this policy.
            </p>

            <h2>2. Information We Collect</h2>
            <h3>Account Information</h3>
            <p>When you create an account, we collect:</p>
            <ul>
              <li>Username</li>
              <li>Password (securely stored)</li>
              <li>Optional profile information (such as name)</li>
              <li>Email address (for password recovery purposes)</li>
            </ul>

            <h3>Usage Information</h3>
            <p>As you use MoviePick, we collect:</p>
            <ul>
              <li>Movies you rate</li>
              <li>Movies you add to your watchlist</li>
              <li>Search queries and browsing activity</li>
              <li>Genre preferences and other interaction data</li>
            </ul>

            <h3>Technical Information</h3>
            <p>We automatically collect certain technical information, including:</p>
            <ul>
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Usage patterns and preferences</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Create and maintain your account</li>
              <li>Provide personalized movie recommendations</li>
              <li>Remember your watchlist and ratings</li>
              <li>Improve and optimize our service</li>
              <li>Send important notifications about your account</li>
              <li>Respond to your requests and provide customer support</li>
              <li>Detect and prevent fraudulent or unauthorized activities</li>
            </ul>

            <h2>4. How We Share Your Information</h2>
            <p>
              MoviePick does not sell your personal information to third parties. We may share your information in the following 
              limited circumstances:
            </p>
            <ul>
              <li>With service providers who help us operate our platform</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights, privacy, safety, or property</li>
              <li>In connection with a business transaction (e.g., merger or acquisition)</li>
            </ul>

            <h2>5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet 
              or electronic storage is 100% secure, so we cannot guarantee absolute security.
            </p>

            <h2>6. Your Rights and Choices</h2>
            <p>Depending on your location, you may have rights regarding your personal information, including:</p>
            <ul>
              <li>Accessing your personal information</li>
              <li>Correcting inaccurate information</li>
              <li>Deleting your personal information</li>
              <li>Restricting or objecting to certain processing activities</li>
              <li>Withdrawing consent</li>
              <li>Data portability</li>
            </ul>
            <p>
              To exercise these rights, please contact us through our <a href="/contact" className="text-primary hover:underline">Contact page</a>.
            </p>

            <h2>7. Children's Privacy</h2>
            <p>
              MoviePick is not intended for children under the age of 13. We do not knowingly collect personal information from 
              children under 13. If you believe we have collected information from a child under 13, please contact us.
            </p>

            <h2>8. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes to our practices or for other operational, 
              legal, or regulatory reasons. We will post the revised policy on this page with an updated "Last updated" date.
              We encourage you to review this policy periodically.
            </p>

            <h2>9. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy or our privacy practices, please contact us through 
              our <a href="/contact" className="text-primary hover:underline">Contact page</a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}