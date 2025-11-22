import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('full_name').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.enu('type', ['internal', 'external'], {
        useNative: true,
        enumName: 'user_type',
      })

      table.enu('role', ['admin', 'organizer', 'attendee'], {
        useNative: true,
        enumName: 'user_role',
      })

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    await this.schema.raw('DROP TYPE IF EXISTS public.user_type CASCADE')
    await this.schema.raw('DROP TYPE IF EXISTS public.user_role CASCADE')
  }
}
