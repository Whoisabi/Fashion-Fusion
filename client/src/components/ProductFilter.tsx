import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface FilterOption {
  id: string;
  label: string;
}

interface ProductFilterProps {
  categories?: FilterOption[];
  sizes?: FilterOption[];
  colors?: FilterOption[];
  minPrice?: number;
  maxPrice?: number;
}

export function ProductFilter({ 
  categories = [],
  sizes = [],
  colors = [],
  minPrice = 0,
  maxPrice = 500
}: ProductFilterProps) {
  const [priceRange, setPriceRange] = useState([minPrice, maxPrice]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
    console.log(`Category ${id} toggled`);
  };

  return (
    <div className="space-y-8" data-testid="filter-panel">
      <div>
        <h3 className="font-bold mb-4">Categories</h3>
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-2">
              <Checkbox 
                id={`category-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
                data-testid={`checkbox-category-${category.id}`}
              />
              <Label 
                htmlFor={`category-${category.id}`}
                className="text-sm cursor-pointer"
              >
                {category.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-4">Price Range</h3>
        <Slider
          min={minPrice}
          max={maxPrice}
          step={10}
          value={priceRange}
          onValueChange={setPriceRange}
          className="mb-4"
          data-testid="slider-price"
        />
        <div className="flex justify-between text-sm">
          <span data-testid="text-min-price">${priceRange[0]}</span>
          <span data-testid="text-max-price">${priceRange[1]}</span>
        </div>
      </div>

      {sizes.length > 0 && (
        <div>
          <h3 className="font-bold mb-4">Size</h3>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <Button
                key={size.id}
                variant="outline"
                size="sm"
                className="toggle-elevate"
                onClick={() => console.log(`Size ${size.label} selected`)}
                data-testid={`button-size-${size.id}`}
              >
                {size.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div>
          <h3 className="font-bold mb-4">Color</h3>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <Button
                key={color.id}
                variant="outline"
                size="sm"
                onClick={() => console.log(`Color ${color.label} selected`)}
                data-testid={`button-color-${color.id}`}
              >
                {color.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => {
          setPriceRange([minPrice, maxPrice]);
          setSelectedCategories([]);
          console.log('Filters cleared');
        }}
        data-testid="button-clear-filters"
      >
        Clear Filters
      </Button>
    </div>
  );
}
