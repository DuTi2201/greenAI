import HeroSection from "@/components/home/hero-section"
import FeaturesSection from "@/components/home/features-section"
import HowItWorksSection from "@/components/home/how-it-works-section"
import TestimonialsSection from "@/components/home/testimonials-section"
import HardwareConnectionSection from "@/components/home/hardware-connection-section"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <HardwareConnectionSection />
      </main>
      <footer className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto text-center">
          <p>&copy; 2023 GreenAI Garden. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

