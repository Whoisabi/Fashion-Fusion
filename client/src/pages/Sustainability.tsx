import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Sustainability() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-4xl font-bold mb-6" data-testid="text-page-title">Sustainability</h1>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg mb-4">
              We are committed to creating fashion that respects both people and the planet.
            </p>
            
            <h2>Our Commitments</h2>
            <ul>
              <li>Using sustainable and organic materials whenever possible</li>
              <li>Partnering with ethical manufacturers</li>
              <li>Reducing waste in our supply chain</li>
              <li>Implementing eco-friendly packaging</li>
            </ul>
            
            <h2>Materials</h2>
            <p>
              We prioritize natural, organic, and recycled materials in our collections. Our goal is to minimize environmental impact while maintaining the quality and style you expect.
            </p>
            
            <h2>Transparency</h2>
            <p>
              We believe in transparency throughout our supply chain. We work closely with our partners to ensure fair labor practices and sustainable production methods.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
