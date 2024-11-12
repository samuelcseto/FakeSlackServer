import Channel from '#models/channel'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    const uniqueKey = 'name'

    await Channel.updateOrCreateMany(uniqueKey, [
      {
        name: 'general',
      },
    ])
  }
}
