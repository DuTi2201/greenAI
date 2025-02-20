"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { userService, type UpdateProfileData } from "@/lib/services/user.service"

export default function ProfilePage() {
  const { user, login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<UpdateProfileData>({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  })

  // Cập nhật formData khi user thay đổi
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      })
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const avatarFile = (form.avatar as HTMLInputElement).files?.[0]
    const data: UpdateProfileData = { ...formData }

    if (avatarFile) {
      data.avatar = avatarFile
    }

    try {
      const updatedUser = await userService.updateProfile(data)
      login(useAuth.getState().token || "", updatedUser)
      toast.success("Đã cập nhật thông tin thành công")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể cập nhật thông tin")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-medium">Hồ sơ cá nhân</h3>
        <p className="text-sm text-muted-foreground">
          Quản lý thông tin cá nhân của bạn
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
          <CardDescription>
            Cập nhật thông tin cá nhân của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{formData.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatar">Ảnh đại diện</Label>
                <Input
                  id="avatar"
                  name="avatar"
                  type="file"
                  accept="image/*"
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Định dạng: JPG, PNG. Tối đa 2MB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Vai trò</Label>
                <Input
                  id="role"
                  value={user?.role}
                  disabled
                />
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Đang cập nhật..." : "Cập nhật thông tin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

