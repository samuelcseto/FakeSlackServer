import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'

export default class ChannelsController {
  public async create({ request, response }: HttpContext) {
    const { name } = request.only(['name'])
    const token = request.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return response.unauthorized({ message: 'Token is required' })
    }

    const user = await User.findByOrFail('token', token)

    const channel = await Channel.create({
      name,
      authorId: user.id,
    })

    return response.created(channel)
  }
}
