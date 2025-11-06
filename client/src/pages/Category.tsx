import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams } from "wouter";

export default function Category() {
  const { slug } = useParams();

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.products.getAll(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.getAll(),
  });

  const currentCategory = categories.find(c => c.slug === slug);
  
  const filteredProducts = products
    .filter(product => {
      if (slug === 'sale') {
        return product.badge === 'Sale';
      }
      return product.categoryId === currentCategory?.id;
    })
    .map(product => ({
      id: product.id,
      title: product.title,
      price: parseFloat(product.price),
      image: product.images[0] || '',
      hoverImage: product.images[1] || '',
      badge: product.badge || undefined,
      category: (product as any).category?.name,
    }));

  const categoryName = slug === 'sale' ? 'Sale' : currentCategory?.name || slug;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold capitalize" data-testid="text-category-title">
                {categoryName}
              </h1>
              <p className="text-muted-foreground mt-2" data-testid="text-product-count">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {productsLoading ? (
                <p>Loading...</p>
              ) : filteredProducts.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground py-12">
                  No products found in this category.
                </p>
              ) : (
                filteredProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
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
