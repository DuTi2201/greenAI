import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-primary to-primary-foreground text-white py-20">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6">Welcome to GreenAI Garden</h1>
        <p className="text-xl mb-8">Revolutionize your gardening experience with AI-powered monitoring and control.</p>
        <div className="space-x-4">
          <Button asChild size="lg">
            <Link href="/register">Get Started</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="#features">Learn More</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

