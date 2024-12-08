import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class UserController {
  public async switchStatus({ request, response, auth }: HttpContext) {
    const { status } = request.only(['status'])
    const user = auth.getUserOrFail()
    await User.query().where('id', user.id).update({ status })
    return response.ok({ message: 'Status updated' })
  }

  public async switchNotificationsOnlyMentions({ request, response, auth }: HttpContext) {
    const { notificationsOnlyMentions } = request.only(['notificationsOnlyMentions'])
    const user = auth.getUserOrFail()
    await User.query().where('id', user.id).update({ notificationsOnlyMentions })
    return response.ok({ message: 'Notifications only mentions updated' })
  }
}
