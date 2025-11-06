import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Wishlist() {
  const { toast } = useToast();
  
  const { data: wishlist, isLoading } = useQuery<any[]>({
    queryKey: ['/api/wishlist'],
  });

  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest('DELETE', `/api/wishlist/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: "Item removed",
        description: "Product removed from wishlist",
      });
    },
  });

  const wishlistItems = wishlist || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <h1 className="text-3xl font-bold mb-8" data-testid="text-wishlist-title">My Wishlist</h1>
          
          {isLoading ? (
            <div className="text-center py-12">
              <p>Loading...</p>
            </div>
          ) : wishlistItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground mb-4" data-testid="text-empty-wishlist">Your wishlist is empty</p>
              <Link href="/shop" asChild>
                <Button data-testid="button-shop">Continue Shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map((item) => (
                <Card key={item.id} className="overflow-hidden" data-testid={`card-wishlist-${item.productId}`}>
                  <Link href={`/product/${item.productId}`}>
                    <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                      <img
                        src={item.product?.images?.[0] || '/placeholder.jpg'}
                        alt={item.product?.title || 'Product'}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        data-testid={`img-wishlist-${item.productId}`}
                      />
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={`/product/${item.productId}`}>
                      <h3 className="font-semibold mb-2" data-testid={`text-title-${item.productId}`}>
                        {item.product?.title}
                      </h3>
                    </Link>
                    <p className="text-lg font-bold mb-4" data-testid={`text-price-${item.productId}`}>
                      ${item.product?.price}
                    </p>
                    <div className="flex gap-2">
                      <Link href={`/product/${item.productId}`} asChild>
                        <Button className="flex-1" data-testid={`button-view-${item.productId}`}>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          View Product
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeMutation.mutate(item.productId)}
                        disabled={removeMutation.isPending}
                        data-testid={`button-remove-${item.productId}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
