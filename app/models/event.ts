import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import User from '#models/user'
import Subscription from '#models/subscription'
import Certificate from '#models/certificate'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export enum EventType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
}

export default class Event extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare name: string

  @column()
  declare type: EventType

  @column()
  declare description: string | null

  @column.dateTime()
  declare date: DateTime

  @column()
  declare location: string | null

  @column()
  declare capacity: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => Subscription)
  declare subscriptions: HasMany<typeof Subscription>

  @hasMany(() => Certificate)
  declare certificates: HasMany<typeof Certificate>

  public static async findByOrganizer(organizerId: number) {
    return await this.query().where('userId', organizerId)
  }

  public static async findAvailable() {
    return await this.query().where((query) => {
      query
        .whereNull('capacity')
        .orWhereRaw(
          'capacity > (SELECT COUNT(*) FROM subscriptions WHERE subscriptions.event_id = events.id AND subscriptions.status = ?)',
          ['confirmed']
        )
    })
  }

  public async getSubscriptionsCount(): Promise<number> {
    const result = await Subscription.query()
      .where('eventId', this.id)
      .where('status', 'confirmed')
      .count('* as total')
      .first()
    return Number(result?.$extras.total || 0)
  }

  public async isFull(): Promise<boolean> {
    if (!this.capacity) return false
    const count = await this.getSubscriptionsCount()
    return count >= this.capacity
  }

  public belongsToUser(userId: number): boolean {
    return this.userId === userId
  }
}
