import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import User from '#models/user'
import Event from '#models/event'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export enum SubscriptionStatus {
  CONFIRMED = 'confirmed',
  ATTENDED = 'attended',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export default class Subscription extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare eventId: number

  @column()
  declare status: SubscriptionStatus

  @column.dateTime()
  declare checkedInAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  public async checkIn() {
    this.status = SubscriptionStatus.ATTENDED
    this.checkedInAt = DateTime.now()
    await this.save()
  }

  public async cancel() {
    this.status = SubscriptionStatus.CANCELLED
    await this.save()
  }

  public async markNoShow() {
    this.status = SubscriptionStatus.NO_SHOW
    await this.save()
  }

  public isConfirmed(): boolean {
    return this.status === SubscriptionStatus.CONFIRMED
  }

  public hasAttended(): boolean {
    return this.status === SubscriptionStatus.ATTENDED
  }

  public isCancelled(): boolean {
    return this.status === SubscriptionStatus.CANCELLED
  }

  public isNoShow(): boolean {
    return this.status === SubscriptionStatus.NO_SHOW
  }

  public hasCheckedIn(): boolean {
    return this.checkedInAt !== null
  }

  public static async findByUser(userId: number) {
    return await this.query().where('userId', userId).preload('event').preload('user')
  }

  public static async findByEvent(eventId: number) {
    return await this.query().where('eventId', eventId).preload('user')
  }

  public static async findByUserAndEvent(userId: number, eventId: number) {
    return await this.query().where('userId', userId).where('eventId', eventId).first()
  }

  public static async subscribe(userId: number, eventId: number) {
    // Check if already subscribed
    const existing = await this.findByUserAndEvent(userId, eventId)
    if (existing) {
      throw new Error('Usuário já está inscrito neste evento')
    }

    const event = await Event.findOrFail(eventId)
    if (await event.isFull()) {
      throw new Error('Evento está lotado')
    }

    return await this.create({
      userId,
      eventId,
      status: SubscriptionStatus.CONFIRMED,
    })
  }
}
