import Channel from '#models/channel'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class ChannelSeeder extends BaseSeeder {
  async run() {
    const uniqueKey = 'name'

    await Channel.updateOrCreateMany(uniqueKey, [
      {
        name: 'global',
        authorId: 1,
      },
      {
        name: 'general',
        authorId: 1,
      },
    ])
  }
}
