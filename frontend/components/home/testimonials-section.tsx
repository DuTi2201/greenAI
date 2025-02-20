import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Home Gardener",
    content: "GreenAI has transformed my small balcony garden. I've never seen my plants so healthy!",
    avatar: "/avatars/sarah.jpg",
  },
  {
    name: "Michael Chen",
    role: "Urban Farmer",
    content:
      "The AI recommendations have significantly increased our crop yield. It's like having an expert gardener on call 24/7.",
    avatar: "/avatars/michael.jpg",
  },
  {
    name: "Emily Rodriguez",
    role: "Botanical Researcher",
    content:
      "The data insights from GreenAI have been invaluable for our plant behavior studies. It's a game-changer in botanical research.",
    avatar: "/avatars/emily.jpg",
  },
]

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{testimonial.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="italic">"{testimonial.content}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

