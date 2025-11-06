import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCard } from "@/components/CategoryCard";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const heroImage = "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&q=80";

export default function Home() {
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.products.getAll(),
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.getAll(),
  });

  const featuredProducts = products.slice(0, 8).map(product => ({
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
        <Hero
          image={heroImage}
          title="New Season Essentials"
          subtitle="Discover our latest collection of contemporary fashion"
          ctaText="Shop Now"
          ctaLink="/shop"
        />

        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold" data-testid="text-featured-title">
                Featured Products
              </h2>
              <Link href="/shop">
                <Button variant="outline" data-testid="button-view-all">
                  View All
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {productsLoading ? (
                <p>Loading...</p>
              ) : (
                featuredProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))
              )}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-8" data-testid="text-categories-title">
              Shop by Category
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {categoriesLoading ? (
                <p>Loading...</p>
              ) : (
                categories.map((category) => (
                  <CategoryCard key={category.slug} name={category.name} slug={category.slug} image={category.image || ''} />
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
