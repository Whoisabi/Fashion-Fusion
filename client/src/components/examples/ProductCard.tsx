import { ProductCard } from '../ProductCard'
import heroImage from '@assets/generated_images/Black_dress_editorial_shot_08cd464c.png'
import hoverImage from '@assets/generated_images/Navy_dress_editorial_photo_d568c8d5.png'

export default function ProductCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <ProductCard
        id="1"
        title="Elegant Evening Dress"
        price={129.99}
        image={heroImage}
        hoverImage={hoverImage}
        badge="New Arrival"
        category="Women"
      />
    </div>
  )
}
