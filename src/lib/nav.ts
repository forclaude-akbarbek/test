import type { Role } from './types'

export const homeFor = (role: Role) => (role === 'student' ? '/app' : role === 'admin' ? '/admin' : `/${role}`)
