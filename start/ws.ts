import app from '@adonisjs/core/services/app'
import Ws from '#services/websocket_service'
import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'
import authConfig from '#config/auth'
import { Socket } from 'socket.io'
import Channel from '#models/channel'
import Message from '#models/message'

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
    console.log('User authenticated:', user.nickname)
    return user
  } catch (error) {
    console.log('Authentication failed:', error)
    return null
  }
}

app.ready(() => {
  Ws.boot()
  const io = Ws.io
  io?.use(async (socket, next) => {
    const token =
      socket.handshake.auth.token ||
      'oat_Mg.NjZ3eHZfQVZfTGFVRnVfUGlaZ2RpY1F2VEk4ZUVDeGctUHcxb1NvVjM0NTE4OTMzMDE'
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
    // Join user to his room
    socket.join('user-' + (socket.data.user as User).id.toString())

    socket.on('getChannels', async () => {
      const user = await User.query()
        .preload('channels')
        .where('id', (socket.data.user as User).id)
        .firstOrFail()
      io?.to('user-' + (socket.data.user as User).id.toString()).emit('channels', user.channels)
    })

    socket.on('getMessages', async (channelId) => {
      try {
        const messages = await Message.query()
          .where('channelId', channelId.channelId)
          .preload('author')
          .orderBy('createdAt', 'asc')
        socket.emit('messages', messages)
      } catch (error) {
        console.error('Error fetching messages:', error)
        socket.emit('error', 'Failed to fetch messages')
      }
    })

    socket.on('message', async (message) => {
      console.log('message', message)
      try {
        const newMessage = await Message.create({
          content: message.text,
          channelId: message.channelId,
          createdBy: (socket.data.user as User).id,
        })

        const messageWithAuthor = await Message.query()
          .where('id', newMessage.id)
          .preload('author')
          .firstOrFail()

        const users = await User.query().whereHas('channels', (builder) => {
          builder.where('channel_id', message.channelId)
        })

        users.forEach((user) => {
          io?.to('user-' + user.id.toString()).emit('newMessage', messageWithAuthor)
        })
      } catch (error) {
        console.error('Error saving message:', error)
        socket.emit('error', 'Failed to save message')
      }
    })

    socket.on('leaveChannel', async (channelId) => {
      try {
        const user = await User.findOrFail((socket.data.user as User).id)
        await user.related('channels').detach([channelId.channelId])
        socket.emit('channelLeft', channelId.channelId)
      } catch (error) {
        console.error('Error leaving channel:', error)
        socket.emit('error', 'Failed to leave channel')
      }
    })

    socket.on('disconnect', () => {
      console.log('user disconnected')
    })
  })
})
