import type { User } from '../payload-types'

export const isAdmin = (user?: User | null): boolean => {
  return user?.role === 'admin'
}

export const isInstructor = (user?: User | null): boolean => {
  return user?.role === 'instructor'
}

export const isStudent = (user?: User | null): boolean => {
  return user?.role === 'student'
}

export const hasRole = (user?: User | null, role?: string): boolean => {
  if (!user || !role) return false
  return user.role === role
}

export const isSameUser = (user?: User | null, id?: string): boolean => {
  if (!user || !id) return false
  return user.id.toString() === id
}

export const isSameTenant = (user?: User | null, tenantId?: string): boolean => {
  if (!user || !tenantId) return false
  return user.tenant?.toString() === tenantId
} 