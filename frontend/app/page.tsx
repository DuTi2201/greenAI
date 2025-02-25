import { HeroSection } from "@/components/hero-section"
import { Features } from "@/components/features"
import { About } from "@/components/about"
import { CallToAction } from "@/components/call-to-action"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <Features />
      <About />
      <CallToAction />
      <Footer />
    </div>
  )
}

