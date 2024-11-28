import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class UserSeeder extends BaseSeeder {
  public async run() {
    await User.createMany([
      {
        email: 'user1@example.com',
        password: 'password',
        nickname: 'Johnny',
      },
      {
        email: 'user2@example.com',
        password: 'password',
        nickname: 'Marika',
      },
      {
        email: 'user3@example.com',
        password: 'password',
        nickname: 'Kate',
      },
      {
        email: 'mario@gmail.com',
        firstName: 'Mario',
        lastName: 'Babiar',
        password: 'Neviem999',
        nickname: 'Mario',
      },
      {
        email: 'samuel@gmail.com',
        firstName: 'Samuel',
        lastName: 'Cseto',
        password: 'Neviem999',
        nickname: 'Samuel',
      },
    ])
  }
}
