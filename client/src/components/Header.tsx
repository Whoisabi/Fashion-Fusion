import { ShoppingCart, User, Search, Menu, Heart, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./ThemeToggle";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: cartData } = useQuery({
    queryKey: ['/api/cart'],
    enabled: !!user,
  });
  
  const cartItemCount = (cartData as any)?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
            
            <Link href="/" asChild>
              <button className="text-xl md:text-2xl font-bold tracking-tight bg-transparent border-0 cursor-pointer" data-testid="link-logo">
                FASHION
              </button>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/category/women" asChild>
              <button className="text-sm font-medium hover:text-muted-foreground transition-colors bg-transparent border-0 cursor-pointer" data-testid="link-women">
                Women
              </button>
            </Link>
            <Link href="/category/men" asChild>
              <button className="text-sm font-medium hover:text-muted-foreground transition-colors bg-transparent border-0 cursor-pointer" data-testid="link-men">
                Men
              </button>
            </Link>
            <Link href="/category/accessories" asChild>
              <button className="text-sm font-medium hover:text-muted-foreground transition-colors bg-transparent border-0 cursor-pointer" data-testid="link-accessories">
                Accessories
              </button>
            </Link>
            <Link href="/category/sale" asChild>
              <button className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors bg-transparent border-0 cursor-pointer" data-testid="link-sale">
                Sale
              </button>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              data-testid="button-search"
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
            
            <Link href="/wishlist" asChild>
              <Button variant="ghost" size="icon" data-testid="button-wishlist">
                <Heart className="h-5 w-5" />
                <span className="sr-only">Wishlist</span>
              </Button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-account">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" data-testid="dropdown-account">
                  <DropdownMenuLabel data-testid="text-user-name">
                    {user.name}
                  </DropdownMenuLabel>
                  <DropdownMenuLabel className="font-normal text-xs text-muted-foreground" data-testid="text-user-email">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.role === 'ADMIN' && (
                    <DropdownMenuItem onClick={() => setLocation('/admin')} data-testid="link-admin">
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setLocation('/orders')} data-testid="link-orders">
                    My Orders
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      logout();
                      setLocation('/');
                    }}
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" asChild>
                <Button variant="ghost" size="icon" data-testid="button-login">
                  <LogIn className="h-5 w-5" />
                  <span className="sr-only">Sign In</span>
                </Button>
              </Link>
            )}

            <Link href="/cart" asChild>
              <Button variant="ghost" size="icon" className="relative" data-testid="button-cart">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    data-testid="badge-cart-count"
                  >
                    {cartItemCount}
                  </Badge>
                )}
                <span className="sr-only">Cart</span>
              </Button>
            </Link>

            <ThemeToggle />
          </div>
        </div>

        {isSearchOpen && (
          <div className="pb-4">
            <Input
              type="search"
              placeholder="Search products..."
              className="max-w-md"
              data-testid="input-search"
              autoFocus
            />
          </div>
        )}

        {isMobileMenuOpen && (
          <nav className="md:hidden pb-4 pt-2 flex flex-col gap-4">
            <Link href="/category/women" asChild>
              <button className="text-sm font-medium text-left bg-transparent border-0 cursor-pointer" data-testid="link-mobile-women">Women</button>
            </Link>
            <Link href="/category/men" asChild>
              <button className="text-sm font-medium text-left bg-transparent border-0 cursor-pointer" data-testid="link-mobile-men">Men</button>
            </Link>
            <Link href="/category/accessories" asChild>
              <button className="text-sm font-medium text-left bg-transparent border-0 cursor-pointer" data-testid="link-mobile-accessories">Accessories</button>
            </Link>
            <Link href="/category/sale" asChild>
              <button className="text-sm font-medium text-destructive text-left bg-transparent border-0 cursor-pointer" data-testid="link-mobile-sale">Sale</button>
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
