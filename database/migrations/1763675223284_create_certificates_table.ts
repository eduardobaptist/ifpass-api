import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'certificates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('event_id').unsigned().references('id').inTable('events').onDelete('CASCADE')
      table.string('verification_token', 64).notNullable().unique()
      table.string('certificate_number').notNullable().unique()
      table.dateTime('issued_at').notNullable()
      table.dateTime('verified_at').nullable()
      table.integer('verification_count').defaultTo(0)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.unique(['user_id', 'event_id'])

      table.index('verification_token')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
