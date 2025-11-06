import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
}

export function CartDrawer({ isOpen, onClose, items: initialItems }: CartDrawerProps) {
  const [items, setItems] = useState(initialItems);

  const updateQuantity = (id: string, delta: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta);
        console.log(`Updated ${item.title} quantity to ${newQuantity}`);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        data-testid="overlay-cart"
      />
      <div 
        className="fixed right-0 top-0 h-full w-full md:w-96 bg-background border-l z-50 flex flex-col"
        data-testid="drawer-cart"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold" data-testid="text-cart-title">Shopping Cart</h2>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-cart">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2" data-testid="text-empty-cart">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">Add some items to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4" data-testid={`cart-item-${item.id}`}>
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-20 h-24 object-cover rounded-md"
                    data-testid={`img-cart-item-${item.id}`}
                  />
                  <div className="flex-1">
                    <h3 className="font-medium mb-1" data-testid={`text-cart-item-title-${item.id}`}>{item.title}</h3>
                    {item.size && (
                      <p className="text-sm text-muted-foreground mb-2">Size: {item.size}</p>
                    )}
                    <p className="font-bold" data-testid={`text-cart-item-price-${item.id}`}>${item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, -1)}
                        data-testid={`button-decrease-${item.id}`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center" data-testid={`text-quantity-${item.id}`}>{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, 1)}
                        data-testid={`button-increase-${item.id}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Subtotal</span>
              <span data-testid="text-subtotal">${subtotal.toFixed(2)}</span>
            </div>
            <Link href="/checkout">
              <Button className="w-full" size="lg" data-testid="button-checkout">
                Checkout
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
