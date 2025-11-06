import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-4xl font-bold mb-6" data-testid="text-page-title">Our Story</h1>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg mb-4">
              Welcome to our fashion destination. We are dedicated to bringing you the latest trends and timeless classics in contemporary fashion.
            </p>
            <p className="mb-4">
              Founded with a passion for style and quality, we curate collections that celebrate individuality and sophistication. Our mission is to make premium fashion accessible to everyone who appreciates craftsmanship and design.
            </p>
            <p>
              From our carefully selected materials to our commitment to sustainable practices, every piece in our collection tells a story of dedication to excellence.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
