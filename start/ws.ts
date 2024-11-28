import app from '@adonisjs/core/services/app'
import Ws from '#services/websocket_service'
import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'
import authConfig from '#config/auth'
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

    socket.on('joinChannel', async (data) => {
      const roomName = 'channel-' + data.channelId
      await socket.join(roomName)
    })

    socket.on('leaveChannel', async (data) => {
      const roomName = 'channel-' + data.channelId
      await socket.leave(roomName)
    })

    socket.on('sendTyping', async (data) => {
      const roomName = 'channel-' + data.channelId

      const room = io.sockets.adapter.rooms.get(roomName)
      if (!room) {
        return
      }

      const recipients = Array.from(room).filter((id) => id !== socket.id)

      recipients.forEach((recipient) => {
        io.to(recipient).emit('getTyping', {
          userNickname: (socket.data.user as User).nickname,
          text: data.text,
        })
      })
    })

    socket.on('getChannels', async () => {
      const user = await User.query()
        .preload('channels')
        .where('id', (socket.data.user as User).id)
        .firstOrFail()
      io?.to('user-' + (socket.data.user as User).id.toString()).emit('channels', user.channels)
    })

    socket.on('getMessages', async ({ channelId, page = 1, pageSize = 20 }) => {
      try {
        // Get total count first
        const total = await Message.query().where('channelId', channelId).count('* as total')
        const totalCount = Number(total[0].$extras.total)

        // Get paginated messages from the end, ordered by newest first
        const messages = await Message.query()
          .where('channelId', channelId)
          .preload('author')
          .orderBy('createdAt', 'asc')
          .offset(Math.max(totalCount - page * pageSize, 0))
          .limit(pageSize)

        if (page >= Math.ceil(totalCount / pageSize)) {
          page = Math.ceil(totalCount / pageSize)
        }

        // Send paginated response
        socket.emit('fetchMessages', {
          data: messages,
          pagination: {
            total: totalCount,
            page: page,
            pageSize: pageSize,
            totalPages: Math.ceil(totalCount / pageSize),
          },
        })
      } catch (error) {
        console.error('Error fetching messages:', error)
        socket.emit('error', 'Failed to fetch messages')
      }
    })

    socket.on('sendMessage', async (message) => {
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
          console.log('user', user.id)
          io?.to('user-' + user.id.toString()).emit('newMessage', messageWithAuthor)
        })
      } catch (error) {
        console.error('Error saving message:', error)
        socket.emit('error', 'Failed to save message')
      }
    })

    socket.on('disconnect', () => {
      console.log('user disconnected')
    })
  })
})
