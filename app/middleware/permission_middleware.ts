import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { UserRole } from '#models/user'

/**
 * Permission middleware to check if user has required role
 */
export default class PermissionMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      roles: UserRole[]
    }
  ) {
    const user = ctx.auth.getUserOrFail()

    if (!options.roles.includes(user.role)) {
      return ctx.response.forbidden({
        message: 'Você não tem permissão para acessar este recurso',
      })
    }

    return next()
  }
}

