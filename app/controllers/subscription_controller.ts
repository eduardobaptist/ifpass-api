import type { HttpContext } from '@adonisjs/core/http'
import Subscription from '#models/subscription'
import { formatDate } from '#utils/date_format'
import Event from '#models/event'
import {
  subscribeValidator,
  checkInValidator,
  subscribeMessages,
  checkInMessages,
} from '#validators/subscription_validator'
import { SubscriptionStatus } from '#models/subscription'
import { UserRole } from '#models/user'

export default class SubscriptionController {
  /**
   * Subscribe to an event
   */
  async subscribe({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await subscribeValidator.validate(request.all(), {
      messages: subscribeMessages,
    } as any)

    try {
      const subscription = await Subscription.subscribe(user.id, payload.eventId)

      await subscription.load('event')

      return response.created({
        subscription: {
          id: subscription.id,
          userId: subscription.userId,
          eventId: subscription.eventId,
          eventName: subscription.event.name,
          status: subscription.status,
          createdAt: formatDate(subscription.createdAt),
        },
        message: 'Inscrição realizada com sucesso',
      })
    } catch (error: any) {
      return response.badRequest({
        message: error.message || 'Erro ao realizar inscrição',
      })
    }
  }

  /**
   * Cancel a subscription
   */
  async cancel({ params, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const subscription = await Subscription.findOrFail(params.id)

    // Check if subscription belongs to user or user is admin/organizer
    if (subscription.userId !== user.id && !user.canManageEvents()) {
      return response.forbidden({
        message: 'Você não tem permissão para cancelar esta inscrição',
      })
    }

    if (subscription.isCancelled()) {
      return response.badRequest({
        message: 'Inscrição já está cancelada',
      })
    }

    if (subscription.hasAttended()) {
      return response.badRequest({
        message: 'Não é possível cancelar uma inscrição de evento já atendido',
      })
    }

    await subscription.cancel()

    return response.ok({
      subscription: {
        id: subscription.id,
        userId: subscription.userId,
        eventId: subscription.eventId,
        status: subscription.status,
        updatedAt: formatDate(subscription.updatedAt),
      },
      message: 'Inscrição cancelada com sucesso',
    })
  }

  /**
   * Check-in / Attend an event
   */
  async attend({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await checkInValidator.validate(request.all(), {
      messages: checkInMessages,
    } as any)

    const subscription = await Subscription.findOrFail(payload.subscriptionId)

    // Only organizers/admins can check-in users, or users can check-in themselves\

    if (subscription.userId !== user.id && !user.canManageEvents()) {
      return response.forbidden({
        message: 'Você não tem permissão para realizar check-in',
      })
    }

    if (subscription.hasAttended()) {
      return response.badRequest({
        message: 'Usuário já realizou check-in neste evento',
      })
    }

    if (subscription.isCancelled()) {
      return response.badRequest({
        message: 'Não é possível fazer check-in de uma inscrição cancelada',
      })
    }

    await subscription.checkIn()

    return response.ok({
      subscription: {
        id: subscription.id,
        userId: subscription.userId,
        eventId: subscription.eventId,
        status: subscription.status,
        checkedInAt: formatDate(subscription.checkedInAt),
        updatedAt: formatDate(subscription.updatedAt),
      },
      message: 'Check-in realizado com sucesso',
    })
  }

  /**
   * List user's subscriptions
   */
  async mySubscriptions({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const subscriptions = await Subscription.findByUser(user.id)

    return response.ok({
      subscriptions: subscriptions.map((sub) => ({
        id: sub.id,
        eventId: sub.eventId,
        eventName: sub.event.name,
        eventDate: formatDate(sub.event.date),
        status: sub.status,
        checkedInAt: formatDate(sub.checkedInAt),
        createdAt: formatDate(sub.createdAt),
      })),
    })
  }

  /**
   * List subscriptions for an event (organizer/admin only)
   */
  async eventSubscriptions({ params, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    if (!user.canManageEvents()) {
      return response.forbidden({
        message: 'Você não tem permissão para visualizar inscrições de eventos',
      })
    }

    const event = await Event.findOrFail(params.id)

    // Check if user owns the event or is admin
    if (!user.isAdmin() && !event.belongsToUser(user.id)) {
      return response.forbidden({
        message: 'Você não tem permissão para visualizar inscrições deste evento',
      })
    }

    const subscriptions = await Subscription.findByEvent(params.id)

    return response.ok({
      subscriptions: subscriptions.map((sub) => ({
        id: sub.id,
        userId: sub.userId,
        userName: sub.user.fullName || sub.user.email,
        status: sub.status,
        checkedInAt: formatDate(sub.checkedInAt),
        createdAt: formatDate(sub.createdAt),
      })),
    })
  }
}
