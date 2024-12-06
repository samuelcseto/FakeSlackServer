import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import User from '#models/user'
import Message from '#models/message'

export default class ChannelsController {
  public async create({ request, response, auth }: HttpContext) {
    const { channelName } = request.only(['channelName'])
    const { privateBool } = request.only(['privateBool'])
    const user = auth.getUserOrFail()

    const channel = await Channel.query().where('name', channelName).first()
    if (channel) {
      return response.badRequest({ message: 'Channel already exists' })
    } else {
      const newChannel = await Channel.create({
        name: channelName,
        authorId: user.id,
        private: privateBool,
      })
      await user.related('channels').attach([newChannel.id])
      return response.created(newChannel)
    }
  }

  public async join({ request, response, auth }: HttpContext) {
    const { channelName } = request.only(['channelName'])
    const { privateBool } = request.only(['privateBool'])
    const user = auth.getUserOrFail()

    const channel = await Channel.query().where('name', channelName).first()
    if (channel) {
      if (channel.private) {
        return response.forbidden({ message: 'Channel is private' })
      }
      const hasBan = await user.related('bans').query().where('channel_id', channel.id).first()
      if (hasBan) {
        return response.forbidden({ message: 'You are banned from this channel' })
      }
      await user.related('channels').attach([channel.id])
      return response.ok(channel)
    } else {
      const newChannel = await Channel.create({
        name: channelName,
        authorId: user.id,
        private: privateBool,
      })
      await user.related('channels').attach([newChannel.id])
      return response.created(newChannel)
    }
  }

  public async listUsers({ request, response }: HttpContext) {
    const channelId = request.param('channelId')

    const channel = await Channel.findOrFail(channelId)
    const users = await channel.related('users').query()

    return response.ok(users)
  }

  public async getMessages({ request, response }: HttpContext) {
    const channelId = request.param('channelId')
    let page = request.param('page')
    const pageSize = 20

    const total = await Message.query().where('channelId', channelId).count('* as total')
    const totalCount = Number(total[0].$extras.total)

    const messages = await Message.query()
      .where('channelId', channelId)
      .preload('author')
      .orderBy('createdAt', 'asc')
      .offset(Math.max(totalCount - page * pageSize, 0))
      .limit(pageSize)

    if (page >= Math.ceil(totalCount / pageSize)) {
      page = Math.ceil(totalCount / pageSize)
    }

    return response.ok({
      messages: messages,
      pagination: {
        total: totalCount,
        page: Number.parseInt(page),
        pageSize: pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    })
  }

  public async getChannels({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('channels')

    const simplifiedChannels = user.channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      isAuthor: channel.authorId === user.id,
      private: channel.private,
    }))

    return response.ok(simplifiedChannels)
  }
}
