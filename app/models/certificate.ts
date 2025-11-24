import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeCreate } from '@adonisjs/lucid/orm'
import User from '#models/user'
import Event from '#models/event'
import Subscription from '#models/subscription'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { randomBytes, createHmac } from 'node:crypto'
import { appKey } from '#config/app'

export default class Certificate extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare eventId: number

  @column()
  declare subscriptionId: number | null

  @column()
  declare verificationToken: string

  @column()
  declare certificateNumber: string

  @column()
  declare signature: string

  @column.dateTime()
  declare issuedAt: DateTime

  @column.dateTime()
  declare verifiedAt: DateTime | null

  @column()
  declare verificationCount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => Subscription)
  declare subscription: BelongsTo<typeof Subscription>

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
    // Generate signature if not already set
    if (!certificate.signature) {
      certificate.signature = Certificate.signToken(certificate.verificationToken)
    }
  }

  /**
   * Sign a token using HMAC-SHA256 with the app key (private key)
   * This is the digital signature that proves the certificate is authentic
   */
  static signToken(token: string): string {
    const secret = appKey.release()
    const hmac = createHmac('sha256', secret)
    hmac.update(token)
    return hmac.digest('hex')
  }

  /**
   * Verify if the token signature is valid
   * This validates that the certificate was issued by our system
   */
  static verifySignature(token: string, signature: string): boolean {
    const expectedSignature = Certificate.signToken(token)
    return expectedSignature === signature
  }

  /**
   * Verify if this certificate's signature is valid
   */
  public isSignatureValid(): boolean {
    return Certificate.verifySignature(this.verificationToken, this.signature)
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
    return (
      this.verificationToken !== null &&
      this.issuedAt !== null &&
      this.signature !== null &&
      this.isSignatureValid()
    )
  }

  /**
   * Find certificate by verification token
   */
  public static async findByToken(token: string) {
    return await this.query().where('verificationToken', token).first()
  }

  /**
   * Find certificates by user
   */
  public static async findByUser(userId: number) {
    return await this.query()
      .where('userId', userId)
      .preload('event')
      .preload('subscription')
      .orderBy('issuedAt', 'desc')
  }
}
