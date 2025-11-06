import { ProductFilter } from '../ProductFilter'

export default function ProductFilterExample() {
  return (
    <div className="p-8 max-w-sm">
      <ProductFilter
        categories={[
          { id: 'dresses', label: 'Dresses' },
          { id: 'tops', label: 'Tops' },
          { id: 'bottoms', label: 'Bottoms' },
          { id: 'outerwear', label: 'Outerwear' }
        ]}
        sizes={[
          { id: 'xs', label: 'XS' },
          { id: 's', label: 'S' },
          { id: 'm', label: 'M' },
          { id: 'l', label: 'L' },
          { id: 'xl', label: 'XL' }
        ]}
        colors={[
          { id: 'black', label: 'Black' },
          { id: 'white', label: 'White' },
          { id: 'navy', label: 'Navy' },
          { id: 'gray', label: 'Gray' }
        ]}
        minPrice={0}
        maxPrice={500}
      />
    </div>
  )
}
