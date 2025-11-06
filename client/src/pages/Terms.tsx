import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
          <h1 className="text-4xl font-bold mb-6" data-testid="text-page-title">Terms of Service</h1>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-sm text-muted-foreground mb-6">Last updated: November 2025</p>
            
            <h2>Acceptance of Terms</h2>
            <p>
              By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
            
            <h2>Use License</h2>
            <p>
              Permission is granted to temporarily access the materials on our website for personal, non-commercial transitory viewing only.
            </p>
            
            <h2>Disclaimer</h2>
            <p>
              The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties.
            </p>
            
            <h2>Limitations</h2>
            <p>
              In no event shall our company or its suppliers be liable for any damages arising out of the use or inability to use the materials on our website.
            </p>
            
            <h2>Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of the United States.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
