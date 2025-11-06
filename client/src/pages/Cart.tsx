import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['/api/cart'],
    enabled: !!user,
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api.cart.updateItem(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (id: string) => api.cart.removeItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
            <p className="text-muted-foreground mb-6">
              You need to be logged in to view your cart
            </p>
            <Link href="/login">
              <Button data-testid="button-login">Log In</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const items = (cartData as any)?.items || [];
  const subtotal = items.reduce(
    (sum: number, item: any) => sum + parseFloat(item.priceAtAdd) * item.quantity,
    0
  );
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-8" data-testid="text-cart-title">
            Shopping Cart
          </h1>

          {isLoading ? (
            <p>Loading...</p>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-6" data-testid="text-empty-cart">
                Your cart is empty
              </p>
              <Link href="/shop">
                <Button data-testid="button-continue-shopping">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border rounded-lg"
                    data-testid={`cart-item-${item.id}`}
                  >
                    <img
                      src={item.product?.images[0]}
                      alt={item.product?.title}
                      className="w-24 h-32 object-cover rounded"
                      data-testid={`img-cart-item-${item.id}`}
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg" data-testid={`text-item-title-${item.id}`}>
                        {item.product?.title}
                      </h3>
                      {item.size && (
                        <p className="text-sm text-muted-foreground" data-testid={`text-item-size-${item.id}`}>
                          Size: {item.size}
                        </p>
                      )}
                      <p className="font-bold mt-2" data-testid={`text-item-price-${item.id}`}>
                        ${parseFloat(item.priceAtAdd).toFixed(2)}
                      </p>

                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center border rounded">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              updateItemMutation.mutate({
                                id: item.id,
                                quantity: item.quantity - 1,
                              })
                            }
                            disabled={updateItemMutation.isPending}
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="px-4" data-testid={`text-quantity-${item.id}`}>
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              updateItemMutation.mutate({
                                id: item.id,
                                quantity: item.quantity + 1,
                              })
                            }
                            disabled={updateItemMutation.isPending}
                            data-testid={`button-increase-${item.id}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItemMutation.mutate(item.id)}
                          disabled={removeItemMutation.isPending}
                          data-testid={`button-remove-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold" data-testid={`text-item-total-${item.id}`}>
                        ${(parseFloat(item.priceAtAdd) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-1">
                <div className="border rounded-lg p-6 sticky top-20">
                  <h2 className="text-xl font-bold mb-4" data-testid="text-order-summary">
                    Order Summary
                  </h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span data-testid="text-subtotal">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (10%)</span>
                      <span data-testid="text-tax">${tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span data-testid="text-total">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Link href="/checkout">
                    <Button className="w-full" size="lg" data-testid="button-checkout">
                      Proceed to Checkout
                    </Button>
                  </Link>
                  
                  <Link href="/shop">
                    <Button
                      variant="outline"
                      className="w-full mt-3"
                      data-testid="button-continue-shopping"
                    >
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
