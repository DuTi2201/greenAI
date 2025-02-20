"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { QrCode, Keyboard } from "lucide-react"

export default function HardwareConnectionSection() {
  const [isOpen, setIsOpen] = useState(false)
  const [connectionMethod, setConnectionMethod] = useState<"serial" | "qr" | null>(null)
  const [serialCode, setSerialCode] = useState("")
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConnect = () => {
    setIsConfirming(true)
    // Simulate API call
    setTimeout(() => {
      setIsConfirming(false)
      setIsOpen(false)
      // Reset state
      setConnectionMethod(null)
      setSerialCode("")
      // Here you would typically update your app state with the new hardware connection
    }, 2000)
  }

  return (
    <section className="py-20 bg-muted">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6">Connect Your Hardware</h2>
        <p className="mb-8">Link your GreenAI hardware to start monitoring your garden</p>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="lg">Connect Hardware</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Connect Your GreenAI Hardware</DialogTitle>
              <DialogDescription>Choose a method to connect your hardware to the GreenAI system.</DialogDescription>
            </DialogHeader>
            {!connectionMethod ? (
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => setConnectionMethod("serial")} className="h-20">
                  <Keyboard className="mr-2 h-4 w-4" />
                  Enter Serial Code
                </Button>
                <Button onClick={() => setConnectionMethod("qr")} className="h-20">
                  <QrCode className="mr-2 h-4 w-4" />
                  Scan QR Code
                </Button>
              </div>
            ) : connectionMethod === "serial" ? (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="serial" className="text-right">
                    Serial Code
                  </Label>
                  <Input
                    id="serial"
                    value={serialCode}
                    onChange={(e) => setSerialCode(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                <p>QR Code scanner would be implemented here</p>
              </div>
            )}
            <DialogFooter>
              {connectionMethod && (
                <Button onClick={handleConnect} disabled={isConfirming}>
                  {isConfirming ? "Connecting..." : "Connect"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}

