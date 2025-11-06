import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { ProductFilter } from "@/components/ProductFilter";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function Shop() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', selectedCategory, searchTerm],
    queryFn: () => api.products.getAll({ categoryId: selectedCategory, search: searchTerm }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.getAll(),
  });

  const displayProducts = products.map(product => ({
    id: product.id,
    title: product.title,
    price: parseFloat(product.price),
    image: product.images[0] || '',
    hoverImage: product.images[1] || '',
    badge: product.badge || undefined,
    category: (product as any).category?.name,
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-shop-title">
                All Products
              </h1>
              <p className="text-muted-foreground" data-testid="text-product-count">
                {displayProducts.length} products
              </p>
            </div>
            
            <Button
              variant="outline"
              className="md:hidden"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              data-testid="button-toggle-filters"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          <div className="flex gap-8">
            <aside className={`
              ${isFilterOpen ? 'block' : 'hidden'} md:block
              w-full md:w-64 flex-shrink-0
            `}>
              <ProductFilter
                categories={categories.map(cat => ({ id: cat.id, label: cat.name }))}
                sizes={[
                  { id: 'xs', label: 'XS' },
                  { id: 's', label: 'S' },
                  { id: 'm', label: 'M' },
                  { id: 'l', label: 'L' },
                  { id: 'xl', label: 'XL' },
                ]}
                colors={[
                  { id: 'black', label: 'Black' },
                  { id: 'white', label: 'White' },
                  { id: 'navy', label: 'Navy' },
                  { id: 'beige', label: 'Beige' },
                ]}
                minPrice={0}
                maxPrice={500}
              />
            </aside>

            <div className="flex-1">
              {isLoading ? (
                <p>Loading products...</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                  {displayProducts.map((product) => (
                    <ProductCard key={product.id} {...product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
