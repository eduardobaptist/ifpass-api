import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { registerValidator, registerMessages } from '#validators/register_validator'
import { loginValidator, loginMessages } from '#validators/login_validator'
import { UserType, UserRole } from '#models/user'
import { formatDate } from '#utils/date_format'

export default class AuthController {
  /**
   * Register a new user
   */
  async register({ request, response }: HttpContext) {
    const payload = await registerValidator.validate(request.all(), {
      messages: registerMessages,
    } as any)

    // Check if user already exists
    const existingUser = await User.findBy('email', payload.email)
    if (existingUser) {
      return response.conflict({
        message: 'Já existe um usuário com este email',
      })
    }

    // Create new user (always as attendee)
    const user = await User.create({
      email: payload.email,
      password: payload.password,
      fullName: payload.fullName || null,
      type: payload.type as UserType,
      role: UserRole.ATTENDEE,
    })

    // Generate access token
    const token = await User.accessTokens.create(user)

    // Set httpOnly cookie with token
    response.cookie('auth_token', token.value!.release(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response.created({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        type: user.type,
        role: user.role,
        createdAt: formatDate(user.createdAt),
        updatedAt: formatDate(user.updatedAt),
      },
      message: 'Usuário registrado com sucesso',
    })
  }

  /**
   * Login user
   */
  async login({ request, response }: HttpContext) {
    const payload = await loginValidator.validate(request.all(), {
      messages: loginMessages,
    } as any)

    try {
      // Verify credentials
      const user = await User.verifyCredentials(payload.email, payload.password)

      // Generate access token
      const token = await User.accessTokens.create(user)

      // Set httpOnly cookie with token
      response.cookie('auth_token', token.value!.release(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      return response.ok({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          type: user.type,
          createdAt: formatDate(user.createdAt),
          updatedAt: formatDate(user.updatedAt),
        },
        message: 'Login realizado com sucesso',
      })
    } catch (error) {
      return response.unauthorized({
        message: 'Credenciais inválidas',
      })
    }
  }

  /**
   * Logout user
   */
  async logout({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    // Get token from Authorization header (set by cookie middleware)
    const authHeader = request.header('authorization')
    if (authHeader) {
      const tokenValue = authHeader.replace('Bearer ', '')

      // Get all tokens for the user and find the matching one
      const tokens = await User.accessTokens.all(user)
      for (const accessToken of tokens) {
        const releasedToken = accessToken.value?.release()
        if (releasedToken === tokenValue) {
          await User.accessTokens.delete(user, accessToken.identifier)
          break
        }
      }
    }

    // Clear cookie
    response.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return response.ok({})
  }

  /**
   * Get current authenticated user
   */
  async me({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    return response.ok({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        type: user.type,
        role: user.role,
        createdAt: formatDate(user.createdAt),
        updatedAt: formatDate(user.updatedAt),
      },
    })
  }
}
