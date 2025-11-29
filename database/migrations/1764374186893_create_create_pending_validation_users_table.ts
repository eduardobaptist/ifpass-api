import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pending_validation_users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('email', 254).notNullable().unique()
      table.string('verification_code', 6).notNullable()
      table.string('password').notNullable()
      table.string('full_name').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index('email')
      table.index('verification_code')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}