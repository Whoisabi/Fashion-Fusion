import { CategoryCard } from '../CategoryCard'
import categoryImage from '@assets/generated_images/Beige_trench_coat_menswear_7ec0bf00.png'

export default function CategoryCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <CategoryCard
        name="Outerwear"
        slug="outerwear"
        image={categoryImage}
        productCount={42}
      />
    </div>
  )
}
