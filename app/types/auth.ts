/**
 * DTOs and types for authentication
 */

export interface RegisterDto {
  email: string
  password: string
  fullName?: string
  type: 'internal' | 'external'
}

export interface LoginDto {
  email: string
  password: string
}

export interface AuthResponse {
  user: {
    id: number
    email: string
    fullName: string | null
    type: 'internal' | 'external'
    createdAt: string
    updatedAt: string | null
  }
  message: string
}
