import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Returns() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-4xl font-bold mb-6" data-testid="text-page-title">Returns & Exchanges</h1>
          <div className="prose dark:prose-invert max-w-none">
            <h2>Return Policy</h2>
            <p>
              We accept returns within 30 days of purchase. Items must be unworn, unwashed, and in original condition with all tags attached.
            </p>
            
            <h2>How to Return</h2>
            <ol>
              <li>Contact our customer service team to initiate a return</li>
              <li>Pack your item securely in its original packaging</li>
              <li>Include your order number and reason for return</li>
              <li>Ship the package to our returns center</li>
            </ol>
            
            <h2>Refunds</h2>
            <p>
              Refunds will be processed within 5-7 business days after we receive your return. The refund will be issued to your original payment method.
            </p>
            
            <h2>Exchanges</h2>
            <p>
              For exchanges, please return your original item and place a new order for the desired item.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
