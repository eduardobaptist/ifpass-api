import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { formatDate } from '#utils/date_format'
import {
  createUserValidator,
  updateUserValidator,
  createUserMessages,
  updateUserMessages,
} from '#validators/user_validator'
import { UserType, UserRole } from '#models/user'
import hash from '@adonisjs/core/services/hash'

export default class UserController {
  /**
   * List all users (admin only)
   */
  async index({ response }: HttpContext) {
    const users = await User.all()

    return response.ok({
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        type: user.type,
        role: user.role,
        createdAt: formatDate(user.createdAt),
        updatedAt: formatDate(user.updatedAt),
      })),
    })
  }

  /**
   * Show a specific user (admin only)
   */
  async show({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)

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
   * Create a new user (admin only)
   */
  async store({ request, response }: HttpContext) {
    const payload = await createUserValidator.validate(request.all(), {
      messages: createUserMessages,
    } as any)

    // Check if user already exists
    const existingUser = await User.findByEmail(payload.email)
    if (existingUser) {
      return response.conflict({
        message: 'Já existe um usuário com este email',
      })
    }

    // Create new user
    const user = await User.create({
      email: payload.email,
      password: payload.password,
      fullName: payload.fullName || null,
      type: payload.type as UserType,
      role: payload.role as UserRole,
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
      message: 'Usuário criado com sucesso',
    })
  }

  /**
   * Update a user (admin only)
   */
  async update({ params, request, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const payload = await updateUserValidator.validate(request.all(), {
      messages: updateUserMessages,
    } as any)

    // Check if email is being changed and already exists
    if (payload.email && payload.email !== user.email) {
      const existingUser = await User.findByEmail(payload.email)
      if (existingUser) {
        return response.conflict({
          message: 'Já existe um usuário com este email',
        })
      }
      user.email = payload.email
    }

    if (payload.password) {
      user.password = await hash.make(payload.password)
    }

    if (payload.fullName !== undefined) {
      user.fullName = payload.fullName || null
    }

    if (payload.type) {
      user.type = payload.type as UserType
    }

    if (payload.role) {
      user.role = payload.role as UserRole
    }

    await user.save()

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
      message: 'Usuário atualizado com sucesso',
    })
  }

  /**
   * Delete a user (admin only)
   */
  async destroy({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.delete()

    return response.ok({
      message: 'Usuário deletado com sucesso',
    })
  }
}
