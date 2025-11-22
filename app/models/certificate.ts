import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeCreate } from '@adonisjs/lucid/orm'
import User from '#models/user'
import Event from '#models/event'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { randomBytes } from 'node:crypto'

export default class Certificate extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare eventId: number

  @column()
  declare verificationToken: string

  @column()
  declare certificateNumber: string

  @column.dateTime()
  declare issuedAt: DateTime

  @column.dateTime()
  declare verifiedAt: DateTime | null

  @column()
  declare verificationCount: number

  @column({
    prepare: (value: any) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @beforeCreate()
  static async generateToken(certificate: Certificate) {
    if (!certificate.verificationToken) {
      certificate.verificationToken = randomBytes(32).toString('hex')
    }
    if (!certificate.certificateNumber) {
      certificate.certificateNumber = `CERT-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`
    }
    if (!certificate.issuedAt) {
      certificate.issuedAt = DateTime.now()
    }
  }

  public async verify() {
    this.verifiedAt = DateTime.now()
    this.verificationCount += 1
    await this.save()
  }

  public getVerificationUrl(baseUrl: string): string {
    return `${baseUrl}/certificates/verify/${this.verificationToken}`
  }

  public isValid(): boolean {
    return this.verificationToken !== null && this.issuedAt !== null
  }
}
