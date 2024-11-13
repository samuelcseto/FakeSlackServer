import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'

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
}
