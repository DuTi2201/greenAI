import { api } from "@/lib/api"

export interface UpdateProfileData {
  name?: string
  email?: string
  phone?: string
  avatar?: File
}

export interface UpdatePasswordData {
  currentPassword: string
  newPassword: string
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  sms: boolean
}

export const userService = {
  async updateProfile(data: UpdateProfileData) {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value)
      }
    })
    
    const response = await api.patch("/users/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  },

  async updatePassword(data: UpdatePasswordData) {
    const response = await api.patch("/users/password", data)
    return response.data
  },

  async getNotificationSettings() {
    const response = await api.get("/users/notifications")
    return response.data as NotificationSettings
  },

  async updateNotificationSettings(settings: NotificationSettings) {
    const response = await api.patch("/users/notifications", settings)
    return response.data
  }
} 