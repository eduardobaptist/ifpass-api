import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Event from '#models/event'
import Subscription from '#models/subscription'
import Certificate from '#models/certificate'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export enum UserType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
}

export enum UserRole {
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  ATTENDEE = 'attendee',
}

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare type: UserType

  @column()
  declare role: UserRole

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User)

  @hasMany(() => Event)
  declare events: HasMany<typeof Event>

  @hasMany(() => Subscription)
  declare subscriptions: HasMany<typeof Subscription>

  @hasMany(() => Certificate)
  declare certificates: HasMany<typeof Certificate>

  public static async findByEmail(email: string) {
    return await this.findBy('email', email)
  }

  public isAdmin(): boolean {
    return this.role === UserRole.ADMIN
  }

  public isOrganizer(): boolean {
    return this.role === UserRole.ORGANIZER
  }

  public isAttendee(): boolean {
    return this.role === UserRole.ATTENDEE
  }

  public canManageEvents(): boolean {
    return this.role === UserRole.ADMIN || this.role === UserRole.ORGANIZER
  }

  public canManageUsers(): boolean {
    return this.role === UserRole.ADMIN
  }
}
