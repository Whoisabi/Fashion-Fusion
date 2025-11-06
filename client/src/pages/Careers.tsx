import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Careers() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-4xl font-bold mb-6" data-testid="text-page-title">Careers</h1>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg mb-4">
              Join our team and help shape the future of fashion.
            </p>
            
            <h2>Why Work With Us</h2>
            <p>
              We're passionate about creating exceptional experiences for our customers and fostering a collaborative, creative work environment for our team.
            </p>
            
            <h2>Our Culture</h2>
            <ul>
              <li>Creative and innovative environment</li>
              <li>Commitment to sustainability and ethics</li>
              <li>Opportunities for growth and development</li>
              <li>Inclusive and diverse workplace</li>
            </ul>
            
            <h2>Current Openings</h2>
            <p>
              We're always looking for talented individuals to join our team. Check back regularly for new opportunities or send your resume to careers@fashion.com.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
