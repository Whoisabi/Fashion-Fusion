import { Hero } from '../Hero'
import heroImage from '@assets/generated_images/Fashion_lifestyle_hero_banner_d5d60e0e.png'

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
