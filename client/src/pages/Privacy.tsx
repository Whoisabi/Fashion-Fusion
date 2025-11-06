import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-4xl font-bold mb-6" data-testid="text-page-title">Privacy Policy</h1>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-sm text-muted-foreground mb-6">Last updated: November 2025</p>
            
            <h2>Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.
            </p>
            
            <h2>How We Use Your Information</h2>
            <p>
              We use the information we collect to process your orders, communicate with you, and improve our services.
            </p>
            
            <h2>Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share your information with service providers who assist us in operating our website and conducting our business.
            </p>
            
            <h2>Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information from unauthorized access and disclosure.
            </p>
            
            <h2>Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal information. Contact us to exercise these rights.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
