import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware to extract token from httpOnly cookie and set it in Authorization header
 * This allows the tokensGuard to authenticate requests using cookies
 */
export default class CookieTokenMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const token = ctx.request.cookie('auth_token')

    // If token exists in cookie and Authorization header is not set, set it
    if (token && !ctx.request.header('authorization')) {
      // Set the Authorization header for the tokensGuard to read
      ctx.request.request.headers.authorization = `Bearer ${token}`
    }

    return next()
  }
}

