import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'subscriptions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('event_id').unsigned().references('id').inTable('events').onDelete('CASCADE')
      table
        .enu('status', ['confirmed', 'attended', 'cancelled', 'no_show'], {
          useNative: true,
          enumName: 'subscription_status',
        })
        .defaultTo('confirmed')
      table.dateTime('checked_in_at').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.unique(['user_id', 'event_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    await this.schema.raw('DROP TYPE IF EXISTS public.subscription_status CASCADE')
  }
}
