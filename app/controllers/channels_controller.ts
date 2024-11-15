import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import User from '#models/user'

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

    try {
      const channel = await Channel.query().where('name', channelName).firstOrFail()
      if (channel.private) {
        return response.forbidden({ message: 'Channel is private' })
      }
      await user.related('channels').attach([channel.id])
      return response.created(channel)
    } catch (error) {
      const channel = await Channel.create({
        name: channelName,
        authorId: user.id,
        private: privateBool,
      })
      await user.related('channels').attach([channel.id])
      return response.created(channel)
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

    // TODO: Check if user is already in the channel

    await invitedUser.related('channels').attach([channel.id])

    return response.created(channel)
  }
}
