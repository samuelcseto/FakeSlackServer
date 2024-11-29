import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import User from '#models/user'
import Message from '#models/message'

export default class ChannelsController {
  public async create({ request, response, auth }: HttpContext) {
    const { name } = request.only(['name'])
    const user = auth.getUserOrFail()

    const channel = await Channel.create({
      name,
      authorId: user.id,
    })

    await user.related('channels').attach([channel.id])

    return response.created(channel)
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
      await user.related('channels').attach([channel.id])
      return response.created(channel)
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

  public async inviteUser({ request, response, auth }: HttpContext) {
    const { channelId, userNickname } = request.only(['channelId', 'userNickname'])
    const user = auth.getUserOrFail()

    const channel = await Channel.query().where('id', channelId).firstOrFail()
    if (channel.authorId !== user.id) {
      return response.forbidden({ message: 'Only the author can invite users' })
    }

    const invitedUser = await User.findBy('nickname', userNickname)

    if (!invitedUser) {
      return response.notFound({ message: 'User not found' })
    }

    if (await invitedUser.related('channels').query().where('channel_id', channelId).first()) {
      return response.badRequest({ message: 'User is already in the channel' })
    }

    await invitedUser.related('channels').attach([channel.id])

    return response.created(channel)
  }

  public async leaveChannel({ request, response, auth }: HttpContext) {
    const channelId = request.param('channelId')
    const user = auth.getUserOrFail()

    const channel = await Channel.findOrFail(channelId)

    if (channel.authorId === user.id) {
      channel.delete()
      return response.ok({ message: 'Channel deleted' })
    } else {
      await user.related('channels').detach([channel.id])
      return response.ok({ message: 'User left channel' })
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
    }))

    return response.ok(simplifiedChannels)
  }
}
