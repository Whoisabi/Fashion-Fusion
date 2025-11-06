import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function PaymentFailure() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1]);
  const orderId = params.get('orderId');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" data-testid="icon-failure" />
            <h1 className="text-2xl font-bold mb-2" data-testid="text-failure-title">
              Payment Failed
            </h1>
            <p className="text-muted-foreground mb-6">
              We couldn't process your payment. Please try again or use a different payment method.
            </p>
            
            {orderId && (
              <div className="bg-muted p-4 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                <p className="font-mono text-sm" data-testid="text-order-id">
                  {orderId}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Your order is on hold. Complete payment to confirm.
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <Link href="/checkout">
                <Button className="w-full" data-testid="button-retry-payment">
                  Try Again
                </Button>
              </Link>
              <Link href="/cart">
                <Button variant="outline" className="w-full" data-testid="button-back-to-cart">
                  Back to Cart
                </Button>
              </Link>
              <Link href="/shop">
                <Button variant="ghost" className="w-full" data-testid="button-continue-shopping">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
