import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface HeroProps {
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

export function Hero({ image, title, subtitle, ctaText, ctaLink }: HeroProps) {
  return (
    <section className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      </div>
      
      <div className="relative h-full max-w-7xl mx-auto px-4 md:px-6 flex items-center">
        <div className="max-w-2xl text-white">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6" data-testid="text-hero-title">
            {title}
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-8 text-white/90" data-testid="text-hero-subtitle">
            {subtitle}
          </p>
          <Link href={ctaLink}>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
              data-testid="button-hero-cta"
            >
              {ctaText}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
