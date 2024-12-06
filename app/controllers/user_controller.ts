import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class UserController {
  public async switchStatus({ request, response, auth }: HttpContext) {
    const { status } = request.only(['status'])
    const user = auth.getUserOrFail()
    await User.query().where('id', user.id).update({ status })
    return response.ok({ message: 'Status updated' })
  }
}
