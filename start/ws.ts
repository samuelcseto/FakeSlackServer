import app from '@adonisjs/core/services/app'
import Ws from '#services/websocket_service'
import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'
import authConfig from '#config/auth'
import { Socket } from 'socket.io'

async function authenticateUser(token: string) {
  const request: Request = {
    header: () => `Bearer ${token}`,
  } as unknown as Request

  let ctx: HttpContext = {
    request: request,
  } as unknown as HttpContext

  const authResolver = await authConfig.resolver(app)
  const auth = authResolver.guards.api(ctx)

  try {
    const user = await auth.authenticate()
    return user
  } catch (error) {
    console.log(error)
    return null
  }
}

app.ready(() => {
  Ws.boot()
  const io = Ws.io
  io?.use(async (socket, next) => {
    const token =
      socket.handshake.auth.token ||
      'oat_NQ.N2diS0p5NGFSUVFFczE4RGp5MGhTUlFXTm02dDJjaXlFdGt2OFRDajYxMDE0NDI3'
    const user = await authenticateUser(token)
    if (!user) {
      socket.disconnect()
      return
    }
    // Add the socket onto the User
    //type UserWithSocket = typeof user & { socket: Socket }
    //;(user as UserWithSocket).socket = socket
    socket.data.user = user
    next()
  })

  io?.on('connection', (socket) => {
    console.log(socket.id)
    console.log((socket.data.user as User).email)
    // Join user to his room
    socket.join('user-' + (socket.data.user as User).id.toString())
    socket.on('message', (message) => {
      console.log('message', message)
      io?.to('user-' + (socket.data.user as User).id.toString()).emit('message', 'Hello')
    })
    socket.on('disconnect', () => {
      console.log('user disconnected')
    })
  })
})
