import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class PendingValidationUser extends BaseModel {
  static table = 'pending_validation_users'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column({ columnName: 'verification_code' })
  declare verificationCode: string

  @column({ serializeAs: null })
  declare password: string

  @column({ columnName: 'full_name' })
  declare fullName: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  public static async findByEmail(email: string) {
    return await this.findBy('email', email)
  }

  public static async findByEmailAndCode(email: string, code: string) {
    return await this.query().where('email', email).where('verification_code', code).first()
  }
}
