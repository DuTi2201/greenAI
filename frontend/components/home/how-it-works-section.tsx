import { CheckCircle } from "lucide-react"

const steps = [
  "Connect your GreenAI hardware to your garden",
  "Set up your account and link your device",
  "Customize your plant profiles and preferences",
  "Monitor your garden's health in real-time",
  "Receive AI-powered recommendations",
  "Enjoy a thriving, effortlessly maintained garden",
]

export default function HowItWorksSection() {
  return (
    <section className="py-20 bg-muted">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center mb-6">
              <CheckCircle className="h-6 w-6 text-primary mr-4" />
              <p className="text-lg">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

