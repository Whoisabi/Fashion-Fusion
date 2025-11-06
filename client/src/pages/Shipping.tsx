import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Shipping() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-4xl font-bold mb-6" data-testid="text-page-title">Shipping Information</h1>
          <div className="prose dark:prose-invert max-w-none">
            <h2>Shipping Methods</h2>
            <ul>
              <li><strong>Standard Shipping:</strong> 5-7 business days</li>
              <li><strong>Express Shipping:</strong> 2-3 business days</li>
              <li><strong>Next Day Delivery:</strong> Order before 2 PM for next day delivery</li>
            </ul>
            
            <h2>Shipping Costs</h2>
            <p>
              Free standard shipping on all orders over $100. Express and next day delivery options available at checkout.
            </p>
            
            <h2>International Shipping</h2>
            <p>
              We ship to select countries worldwide. Shipping times and costs vary by location. All duties and taxes are the responsibility of the customer.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
