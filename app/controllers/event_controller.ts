import type { HttpContext } from '@adonisjs/core/http'
import Event from '#models/event'
import { formatDate, parseDate } from '#utils/date_format'
import {
  createEventValidator,
  updateEventValidator,
  createEventMessages,
  updateEventMessages,
} from '#validators/event_validator'
import { EventType } from '#models/event'

export default class EventController {
  /**
   * List all events
   */
  async index({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    let query = Event.query().preload('user')

    // Organizers and admins can see their own events
    if (user.canManageEvents()) {
      if (request.qs().myEvents === 'true') {
        query = query.where('userId', user.id)
      }
    }

    const events = await query.orderBy('date', 'desc')

    // Map events with subscription counts
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const subscriptionsCount = await event.getSubscriptionsCount()

        return {
          id: event.id,
          userId: event.userId,
          organizerName: event.user.fullName || event.user.email,
          name: event.name,
          type: event.type,
          description: event.description,
          date: formatDate(event.date),
          availableSeats: (event.capacity || 0) - subscriptionsCount,
          location: event.location,
          capacity: event.capacity,
          subscriptionsCount: subscriptionsCount,
          createdAt: formatDate(event.createdAt),
          updatedAt: formatDate(event.updatedAt),
        }
      })
    )

    return response.ok({
      events: eventsWithCounts,
    })
  }

  /**
   * Show a specific event
   */
  async show({ params, response }: HttpContext) {
    const event = await Event.findOrFail(params.id)
    await event.load('user')
    const subscriptionsCount = await event.getSubscriptionsCount()
    const availableSeats = event.capacity || 0 - subscriptionsCount

    return response.ok({
      event: {
        id: event.id,
        userId: event.userId,
        organizerName: event.user.fullName || event.user.email,
        name: event.name,
        type: event.type,
        description: event.description,
        date: formatDate(event.date),
        location: event.location,
        capacity: event.capacity,
        availableSeats: availableSeats,
        subscriptionsCount,
        isFull: await event.isFull(),
        createdAt: formatDate(event.createdAt),
        updatedAt: formatDate(event.updatedAt),
      },
    })
  }

  /**
   * Create a new event (organizer/admin only)
   */
  async store({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await createEventValidator.validate(request.all(), {
      messages: createEventMessages,
    } as any)

    const event = await Event.create({
      userId: user.id,
      name: payload.name,
      type: payload.type as EventType,
      description: payload.description || null,
      date: parseDate(payload.date),
      location: payload.location || null,
      capacity: payload.capacity || null,
    })

    return response.created({
      event: {
        id: event.id,
        userId: event.userId,
        name: event.name,
        type: event.type,
        description: event.description,
        date: formatDate(event.date),
        location: event.location,
        capacity: event.capacity,
        createdAt: formatDate(event.createdAt),
        updatedAt: formatDate(event.updatedAt),
      },
      message: 'Evento criado com sucesso',
    })
  }

  /**
   * Update an event (organizer/admin only - can only update own events unless admin)
   */
  async update({ params, request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const event = await Event.findOrFail(params.id)

    // Check if user can update this event
    if (!user.isAdmin() && !event.belongsToUser(user.id)) {
      return response.forbidden({
        message: 'Você não tem permissão para atualizar este evento',
      })
    }

    const payload = await updateEventValidator.validate(request.all(), {
      messages: updateEventMessages,
    } as any)

    if (payload.name) {
      event.name = payload.name
    }

    if (payload.type) {
      event.type = payload.type as EventType
    }

    if (payload.description !== undefined) {
      event.description = payload.description || null
    }

    if (payload.date) {
      event.date = parseDate(payload.date)
    }

    if (payload.location !== undefined) {
      event.location = payload.location || null
    }

    if (payload.capacity !== undefined) {
      event.capacity = payload.capacity || null
    }

    await event.save()

    return response.ok({
      event: {
        id: event.id,
        userId: event.userId,
        name: event.name,
        type: event.type,
        description: event.description,
        date: formatDate(event.date),
        location: event.location,
        capacity: event.capacity,
        createdAt: formatDate(event.createdAt),
        updatedAt: formatDate(event.updatedAt),
      },
      message: 'Evento atualizado com sucesso',
    })
  }

  /**
   * Delete an event (organizer/admin only - can only delete own events unless admin)
   */
  async destroy({ params, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const event = await Event.findOrFail(params.id)

    // Check if user can delete this event
    if (!user.isAdmin() && !event.belongsToUser(user.id)) {
      return response.forbidden({
        message: 'Você não tem permissão para deletar este evento',
      })
    }

    await event.delete()

    return response.ok({
      message: 'Evento deletado com sucesso',
    })
  }
}
