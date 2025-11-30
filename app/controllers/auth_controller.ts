import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import PendingValidationUser from '#models/pending_validation_user'
import { registerValidator, registerMessages } from '#validators/register_validator'
import { loginValidator, loginMessages } from '#validators/login_validator'
import {
  internalRegisterValidator,
  internalRegisterMessages,
} from '#validators/internal_register_validator'
import {
  verifyInternalValidator,
  verifyInternalMessages,
} from '#validators/verify_internal_validator'
import { UserType, UserRole } from '#models/user'
import { formatDate } from '#utils/date_format'
import hash from '@adonisjs/core/services/hash'
import emailService from '#services/email_service'
import db from '@adonisjs/lucid/services/db'

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

  /**
   * Register a new internal user (pending validation)
   */
  async registerInternal({ request, response }: HttpContext) {
    const payload = await internalRegisterValidator.validate(request.all(), {
      messages: internalRegisterMessages,
    } as any)

    // Check if user already exists
    const existingUser = await User.findBy('email', payload.email)
    if (existingUser) {
      return response.conflict({
        message: 'Já existe um usuário com este email',
      })
    }

    // Check if there's already a pending validation for this email
    const existingPending = await PendingValidationUser.findByEmail(payload.email)
    if (existingPending) {
      // Delete old pending validation
      await existingPending.delete()
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Hash password
    const hashedPassword = await hash.make(payload.password)

    // Create pending validation user
    const pendingUser = await PendingValidationUser.create({
      email: payload.email,
      password: hashedPassword,
      fullName: payload.fullName || null,
      verificationCode,
    })

    // Send verification email
    try {
      await emailService.sendVerificationCode(payload.email, verificationCode, payload.fullName)
    } catch (error) {
      // If email fails, delete the pending user and return error
      await pendingUser.delete()
      return response.internalServerError({
        message: 'Erro ao enviar email de verificação. Tente novamente mais tarde.',
      })
    }

    return response.created({
      message: 'Email de verificação enviado. Verifique sua caixa de entrada.',
    })
  }

  /**
   * Verify internal user with code and create user account
   */
  async verifyInternal({ request, response }: HttpContext) {
    const payload = await verifyInternalValidator.validate(request.all(), {
      messages: verifyInternalMessages,
    } as any)

    // Find pending validation user
    const pendingUser = await PendingValidationUser.findByEmailAndCode(payload.email, payload.code)

    if (!pendingUser) {
      return response.badRequest({
        message: 'Código de verificação inválido ou expirado',
      })
    }

    // Check if user already exists (race condition check)
    const existingUser = await User.findBy('email', payload.email)
    if (existingUser) {
      // Clean up pending validation
      await pendingUser.delete()
      return response.conflict({
        message: 'Já existe um usuário com este email',
      })
    }

    const result = await db
      .insertQuery()
      .table('users')
      .insert({
        email: pendingUser.email,
        password: pendingUser.password,
        full_name: pendingUser.fullName,
        type: UserType.INTERNAL,
        role: UserRole.ATTENDEE,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('id')

    // Fetch the created user
    const user = await User.findOrFail(result[0].id)

    // Delete pending validation
    await pendingUser.delete()

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
        type: user.type,
        role: user.role,
        createdAt: formatDate(user.createdAt),
        updatedAt: formatDate(user.updatedAt),
      },
      message: 'Usuário interno verificado e registrado com sucesso',
    })
  }
}
