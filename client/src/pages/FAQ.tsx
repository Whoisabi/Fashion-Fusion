import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function FAQ() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-4xl font-bold mb-6" data-testid="text-page-title">Frequently Asked Questions</h1>
          <div className="prose dark:prose-invert max-w-none space-y-6">
            <div>
              <h3>How do I track my order?</h3>
              <p>
                You will receive a tracking number via email once your order ships. You can use this number to track your package on our website or the carrier's website.
              </p>
            </div>
            
            <div>
              <h3>What payment methods do you accept?</h3>
              <p>
                We accept all major credit cards, PayPal, and Apple Pay.
              </p>
            </div>
            
            <div>
              <h3>Do you offer gift wrapping?</h3>
              <p>
                Yes! Gift wrapping is available for a small fee at checkout.
              </p>
            </div>
            
            <div>
              <h3>What is your size guide?</h3>
              <p>
                Please refer to the size chart on each product page for detailed measurements.
              </p>
            </div>
            
            <div>
              <h3>How do I care for my garments?</h3>
              <p>
                Care instructions are provided on the label of each garment. Generally, we recommend gentle washing and air drying for best results.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
