import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import app from '@adonisjs/core/services/app'
import authConfig from '#config/auth'

export default class ChannelsController {
  public async create({ request, response }: HttpContext) {
    const { name } = request.only(['name'])
    const token = request.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return response.unauthorized({ message: 'Token is required' })
    }

    const authResolver = await authConfig.resolver(app)
    let ctx: HttpContext = {
      request: request,
    } as unknown as HttpContext
    const auth = authResolver.guards.api(ctx)

    try {
      const user = await auth.authenticate()

      if (!user) {
        return response.unauthorized({ message: 'Invalid token' })
      }

      const channel = await Channel.create({
        name,
        authorId: user.id,
      })

      console.log('Channel created:', channel.name)

      // add the user to the channel
      await user.related('channels').attach([channel.id])

      return response.created(channel)
    } catch (error) {
      console.log('Authentication failed:', error)
    }
  }
}
