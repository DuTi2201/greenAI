import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Leaf, Droplet, Sun, Cpu } from "lucide-react"

const features = [
  {
    title: "Smart Monitoring",
    description: "Real-time data on soil moisture, temperature, and light levels.",
    icon: Leaf,
  },
  {
    title: "Automated Irrigation",
    description: "Precise watering based on plant needs and weather conditions.",
    icon: Droplet,
  },
  {
    title: "Light Optimization",
    description: "Adjust lighting for optimal plant growth and energy efficiency.",
    icon: Sun,
  },
  {
    title: "AI-Powered Insights",
    description: "Get personalized recommendations for your garden's health.",
    icon: Cpu,
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

