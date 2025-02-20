import { cookies } from "next/headers"

export async function getSession() {
  const token = cookies().get("token")
  if (!token) return null

  try {
    // Verify token with backend
    const response = await fetch("http://localhost:3001/api/auth/verify", {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    return null
  }
} 