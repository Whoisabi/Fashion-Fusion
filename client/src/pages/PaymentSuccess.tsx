import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";

export default function PaymentSuccess() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1]);
  const orderId = params.get('orderId');
  const method = params.get('method');

  useEffect(() => {
    // Celebrate!
    console.log('Payment successful!', { orderId, method });
  }, [orderId, method]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" data-testid="icon-success" />
            <h1 className="text-2xl font-bold mb-2" data-testid="text-success-title">
              Payment Successful!
            </h1>
            <p className="text-muted-foreground mb-6">
              Your order has been placed successfully.
            </p>
            
            {orderId && (
              <div className="bg-muted p-4 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                <p className="font-mono text-sm" data-testid="text-order-id">
                  {orderId}
                </p>
              </div>
            )}

            {method === 'bank' && (
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-6 text-left">
                <h3 className="font-semibold mb-2">Bank Transfer Instructions</h3>
                <div className="text-sm space-y-2 text-muted-foreground">
                  <p><strong>Bank:</strong> Nepal Bank Limited</p>
                  <p><strong>Account Name:</strong> Fashion E-commerce</p>
                  <p><strong>Account Number:</strong> 0123456789</p>
                  <p><strong>Amount:</strong> See order details</p>
                  <p className="text-xs mt-2">
                    Please include your Order ID ({orderId?.slice(0, 8)}) in the transfer description.
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <Link href="/orders">
                <Button className="w-full" data-testid="button-view-orders">
                  View My Orders
                </Button>
              </Link>
              <Link href="/shop">
                <Button variant="outline" className="w-full" data-testid="button-continue-shopping">
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
