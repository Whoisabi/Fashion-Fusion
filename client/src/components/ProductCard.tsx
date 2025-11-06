import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  hoverImage?: string;
  badge?: string;
  category?: string;
}

export function ProductCard({ 
  id, 
  title, 
  price, 
  image, 
  hoverImage,
  badge,
  category 
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: wishlist = [] } = useQuery<any[]>({
    queryKey: ['/api/wishlist'],
    enabled: !!user,
  });

  const isWishlisted = wishlist.some((item: any) => item.productId === id);

  const addMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/wishlist', { productId: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: "Added to wishlist",
        description: `${title} has been added to your wishlist`,
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/wishlist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: "Removed from wishlist",
        description: `${title} has been removed from your wishlist`,
      });
    },
  });

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!user) {
      setLocation('/login');
      return;
    }

    if (isWishlisted) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  return (
    <Card 
      className="group overflow-hidden border-0 bg-transparent hover-elevate"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`card-product-${id}`}
    >
      <Link href={`/product/${id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <img
            src={isHovered && hoverImage ? hoverImage : image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-testid={`img-product-${id}`}
          />
          
          {badge && (
            <Badge 
              className="absolute top-3 left-3"
              variant={badge === "Sale" ? "destructive" : "secondary"}
              data-testid={`badge-${badge.toLowerCase()}`}
            >
              {badge}
            </Badge>
          )}

          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-3 right-3 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity ${
              isWishlisted ? 'text-destructive' : ''
            }`}
            onClick={handleWishlistToggle}
            disabled={addMutation.isPending || removeMutation.isPending}
            data-testid={`button-wishlist-${id}`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </Link>

      <div className="p-4 space-y-2">
        {category && (
          <p className="text-xs uppercase tracking-wide text-muted-foreground" data-testid={`text-category-${id}`}>
            {category}
          </p>
        )}
        <Link href={`/product/${id}`}>
          <h3 className="font-medium text-lg hover:text-muted-foreground transition-colors" data-testid={`text-title-${id}`}>
            {title}
          </h3>
        </Link>
        <p className="font-bold text-xl" data-testid={`text-price-${id}`}>
          ${price.toFixed(2)}
        </p>
      </div>
    </Card>
  );
}
