import type { Access } from 'payload'

export const isAdmin: Access = async ({ req }) => {
  return req.user?.role === 'admin'
}

export const isInstructor: Access = async ({ req }) => {
  return req.user?.role === 'instructor'
}

export const isStudent: Access = async ({ req }) => {
  return req.user?.role === 'student'
}

export const hasRole: Access = async ({ req }, role?: string) => {
  if (!req.user || !role) return false
  return req.user.role === role
}

export const isSameUser: Access = async ({ req, id }) => {
  if (!req.user || !id || typeof id !== 'string') return false
  return req.user.id.toString() === id
}

export const isSameTenant: Access = async ({ req }, tenantId?: string) => {
  if (!req.user || !tenantId) return false
  return req.user.tenant?.toString() === tenantId
}

export const isAdminOrInstructor: Access = async ({ req }) => {
  return req.user?.role === 'admin' || req.user?.role === 'instructor'
}

export const isAdminOrSelf: Access = async ({ req, id }) => {
  if (!req.user) return false
  if (req.user.role === 'admin') return true
  return req.user.id.toString() === id?.toString()
}

export const isAdminOrInstructorOrSelf: Access = async ({ req, id }) => {
  if (!id || typeof id !== 'string') return false
  return (
    req.user?.role === 'admin' ||
    req.user?.role === 'instructor' ||
    (req.user?.role === 'student' && req.user.id.toString() === id)
  )
}
