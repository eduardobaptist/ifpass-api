import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('name').notNullable()
      table.enu('type', ['internal', 'external'], {
        useNative: true,
        enumName: 'event_type',
      })
      table.text('description').nullable()
      table.dateTime('date').notNullable()
      table.string('location').nullable()
      table.integer('capacity').unsigned().nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    await this.schema.raw('DROP TYPE IF EXISTS public.event_type CASCADE')
  }
}
