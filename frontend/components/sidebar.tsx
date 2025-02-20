"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Sliders, Brain, BarChart2, Settings, LogOut, Leaf, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"

const menuItems = [
  {
    name: "Dashboard",
    icon: Home,
    path: "/dashboard",
    description: "Overview of your garden",
  },
  {
    name: "Control",
    icon: Sliders,
    path: "/control",
    description: "Control your devices",
  },
  {
    name: "AI Advisor",
    icon: Brain,
    path: "/advisor",
    description: "Get AI-powered advice",
  },
  {
    name: "Reports",
    icon: BarChart2,
    path: "/reports",
    description: "View analytics and history",
  },
]

const bottomMenuItems = [
  {
    name: "Profile",
    icon: User,
    path: "/profile",
    description: "Manage your account",
  },
  {
    name: "Settings",
    icon: Settings,
    path: "/settings",
    description: "System settings",
  },
]

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    // Here you would typically handle the logout logic
    console.log("Logging out")
    // Redirect to the home page
    router.push("/")
  }

  return (
    <TooltipProvider>
      <aside className="flex flex-col w-64 border-r bg-card">
        {/* Logo */}
        <div className="p-6">
          <Link href="/" className="flex items-center space-x-2 text-primary hover:text-primary/90">
            <Leaf className="h-6 w-6" />
            <span className="font-semibold text-lg">GreenAI Garden</span>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    pathname === item.path ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.description}</TooltipContent>
            </Tooltip>
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t px-4 py-4 space-y-1">
          {bottomMenuItems.map((item) => (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    pathname === item.path ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.description}</TooltipContent>
            </Tooltip>
          ))}

          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}

