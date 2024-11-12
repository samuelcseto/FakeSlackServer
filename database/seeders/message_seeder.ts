import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Message from '#models/message'
import User from '#models/user'
import Channel from '#models/channel'

export default class MessageSeeder extends BaseSeeder {
  public static environment = ['development', 'testing']

  public async run() {
    const users = await User.all()
    const channels = await Channel.all()

    if (users.length === 0) {
      console.error('No users found')
      return
    }

    const generalChannel = channels.find((channel) => channel.name === 'general')
    const globalChannel = channels.find((channel) => channel.name === 'global')

    if (generalChannel) {
      for (const user of users) {
        await user.related('channels').attach([generalChannel.id])
      }

      await Message.createMany([
        {
          content: 'Welcome to the general channel!',
          createdBy: users[0].id,
          channelId: generalChannel.id,
        },
        {
          content: 'Hello everyone!',
          createdBy: users[1].id,
          channelId: generalChannel.id,
        },
        {
          content: 'Good to see you all here.',
          createdBy: users[2].id,
          channelId: generalChannel.id,
        },
      ])
    }

    if (globalChannel) {
      for (const user of users) {
        await user.related('channels').attach([globalChannel.id])
      }

      await Message.createMany([
        {
          content: 'Welcome to the global channel!',
          createdBy: users[0].id,
          channelId: globalChannel.id,
        },
        {
          content: 'This is a global announcement.',
          createdBy: users[1].id,
          channelId: globalChannel.id,
        },
        {
          content: 'Stay tuned for more updates.',
          createdBy: users[2].id,
          channelId: globalChannel.id,
        },
      ])
    }
  }
}
