import { CartDrawer } from '../CartDrawer'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import productImage from '@assets/generated_images/Black_dress_editorial_shot_08cd464c.png'

export default function CartDrawerExample() {
  const [isOpen, setIsOpen] = useState(true)
  
  const mockItems = [
    {
      id: '1',
      title: 'Elegant Evening Dress',
      price: 129.99,
      quantity: 1,
      image: productImage,
      size: 'M'
    },
    {
      id: '2',
      title: 'Classic White Sneakers',
      price: 89.99,
      quantity: 2,
      image: productImage,
      size: '9'
    }
  ]

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Cart</Button>
      <CartDrawer 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        items={mockItems}
      />
    </div>
  )
}
