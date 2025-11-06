import { Link } from "wouter";
import { Card } from "@/components/ui/card";

interface CategoryCardProps {
  name: string;
  slug: string;
  image: string;
  productCount?: number;
}

export function CategoryCard({ name, slug, image, productCount }: CategoryCardProps) {
  return (
    <Link href={`/category/${slug}`}>
      <Card 
        className="group overflow-hidden border-0 hover-elevate cursor-pointer"
        data-testid={`card-category-${slug}`}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-testid={`img-category-${slug}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h3 className="text-2xl font-bold mb-1" data-testid={`text-category-name-${slug}`}>
              {name}
            </h3>
            {productCount !== undefined && (
              <p className="text-sm text-white/80" data-testid={`text-category-count-${slug}`}>
                {productCount} Products
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
