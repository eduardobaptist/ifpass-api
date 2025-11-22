import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import { UserType, UserRole } from '#models/user'

export default class extends BaseSeeder {
  async run() {
    const existingAdmin = await User.findBy('email', 'admin@ifpass.com')
    if (existingAdmin) {
      console.log('Usuário admin já existe')
      return
    }

    await User.create({
      email: 'admin@ifpass.com',
      password: 'admin123',
      fullName: 'Administrador',
      type: UserType.INTERNAL,
      role: UserRole.ADMIN,
    })
  }
}

