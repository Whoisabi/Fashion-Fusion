import { Hero } from '../Hero'

const heroImage = "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&q=80";

export default function HeroExample() {
  return (
    <Hero
      image={heroImage}
      title="New Season Essentials"
      subtitle="Discover our latest collection of contemporary fashion"
      ctaText="Shop Now"
      ctaLink="/shop"
    />
  )
}
