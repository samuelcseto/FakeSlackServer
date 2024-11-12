import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import { registerUserValidator } from '#validators/register_user'

export default class AuthController {
  async register({ request }: HttpContext) {
    const data = request.all()
    const payload = await registerUserValidator.validate(data)
    const user = await User.create({
      email: payload.email,
      password: payload.password,
    })
    // join user to general channel
    //const general = await Channel.findByOrFail('name', 'general')
    //await user.related('channels').attach([general.id])

    return user
  }

  async login({ auth, request }: HttpContext) {
    const email = request.input('email')
    const password = request.input('password')

    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user)

    return token
  }

  async logout({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    return { revoked: true }
  }

  async me({ auth }: HttpContext) {
    return auth.getUserOrFail()
  }
}
