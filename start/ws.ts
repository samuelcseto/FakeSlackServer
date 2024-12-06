import app from '@adonisjs/core/services/app'
import Ws from '#services/websocket_service'
import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'
import authConfig from '#config/auth'
import Message from '#models/message'
import Channel from '#models/channel'
import { DateTime } from 'luxon'

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

    socket.on('joinChannelSocket', async (data) => {
      const roomName = 'channel-' + data.channelId
      await socket.join(roomName)
    })

    socket.on('leaveChannelSocket', async (data) => {
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

        const channel = await Channel.findOrFail(message.channelId)
        channel.lastActivity = DateTime.now()
        await channel.save()

        users.forEach((user) => {
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

    socket.on('leaveChannel', async (data) => {
      const user = socket.data.user as User
      const channel = await Channel.findOrFail(data.channelId)

      if (channel.authorId === user.id) {
        await channel.delete()
        io.to('channel-' + channel.id).emit('channelDeleted', channel.id)
        return
      }

      await user.related('channels').detach([channel.id])
      io.to('user-' + user.id.toString()).emit('leaveChannelSuccess', { channelName: channel.name })
    })

    socket.on('inviteUser', async (data) => {
      // Find the user to invite
      const invitedUser = await User.findBy('nickname', data.userNickname)
      if (!invitedUser) {
        socket.emit('error', 'User not found')
        return
      }

      const channel = await Channel.findOrFail(data.channelId)

      // Only the author can invite users to private channels
      if (channel.private && channel.authorId !== (socket.data.user as User).id) {
        socket.emit('error', 'Only the author can invite users')
        return
      }

      // Check if the user is already in the channel
      const userInDB = await invitedUser
        .related('channels')
        .query()
        .where('channel_id', data.channelId)
        .first()
      if (userInDB) {
        socket.emit('error', 'User is already in the channel')
        return
      }

      // Invite user and remove ban record if author is inviting
      if (channel.authorId === (socket.data.user as User).id) {
        await invitedUser.related('bans').detach([channel.id])
      }

      // Check if the user is banned from the channel
      const hasBan = await invitedUser
        .related('bans')
        .query()
        .where('channel_id', channel.id)
        .first()
      if (hasBan) {
        socket.emit('error', 'User is banned from the channel')
        return
      }

      await invitedUser.related('channels').attach([channel.id])
      io.to('user-' + socket.data.user.id.toString()).emit('inviteUserSuccess', {})

      io.to('user-' + invitedUser.id.toString()).emit('channelInvited', {
        id: channel.id,
        name: channel.name,
        isAuthor: false,
        private: channel.private,
      })
    })

    socket.on('revokeUser', async (data) => {
      // Find the user to revoke
      const revokedUser = await User.findBy('nickname', data.userNickname)
      if (!revokedUser) {
        socket.emit('error', 'User not found')
        return
      }

      const channel = await Channel.findOrFail(data.channelId)

      // A user cannot revoke himself
      if (socket.data.user.id === revokedUser.id) {
        socket.emit('error', 'You cannot revoke yourself')
        return
      }

      // global and general channels cannot have users revoked
      if (channel.name === 'general' || channel.name === 'global') {
        socket.emit('error', 'Cannot revoke users from global or general channels')
        return
      }

      // Only the author can revoke users from private channels
      if (channel.private && channel.authorId !== (socket.data.user as User).id) {
        socket.emit('error', 'Only the author can revoke users')
        return
      }

      const userInDB = await revokedUser
        .related('channels')
        .query()
        .where('channel_id', data.channelId)
        .first()
      if (!userInDB) {
        socket.emit('error', 'User is not in the channel')
        return
      }

      await revokedUser.related('channels').detach([channel.id])
      io.to('user-' + socket.data.user.id.toString()).emit('revokeUserSuccess', {})

      io.to('user-' + revokedUser.id.toString()).emit('channelRevoked', channel.id)
    })

    socket.on('kickUser', async (data) => {
      // Find the user to kick
      const kickedUser = await User.findBy('nickname', data.userNickname)
      if (!kickedUser) {
        socket.emit('error', 'User not found')
        return
      }

      const channel = await Channel.findOrFail(data.channelId)

      // A user cannot kick himself
      if (socket.data.user.id === kickedUser.id) {
        socket.emit('error', 'You cannot kick yourself')
        return
      }

      // Can't kick author of the channel
      if (channel.authorId === kickedUser.id) {
        socket.emit('error', 'Cannot kick the author of the channel')
        return
      }

      // global and general channels cannot have users kicked
      if (channel.name === 'general' || channel.name === 'global') {
        socket.emit('error', 'Cannot kick users from global or general channels')
        return
      }

      // Only the author can kick users from private channels
      if (channel.private && channel.authorId !== (socket.data.user as User).id) {
        socket.emit('error', 'Only the author can kick users')
        return
      }

      // Check if the user is in the channel
      const userInDB = await kickedUser
        .related('channels')
        .query()
        .where('channel_id', data.channelId)
        .first()
      if (!userInDB) {
        socket.emit('error', 'User is not in the channel')
        return
      }

      // Check if admin of channel is voting
      if (channel.authorId === (socket.data.user as User).id) {
        await kickedUser.related('channels').detach([channel.id])
        await kickedUser.related('kicksReceived').query().where('channel_id', channel.id).delete()
        await kickedUser.related('bans').attach([channel.id])

        io.to('user-' + kickedUser.id.toString()).emit('channelRevoked', channel.id)
        io.to('channel-' + channel.id).emit('userBanned', {
          userNickname: kickedUser.nickname,
          channelId: channel.id,
        })
        return
      }

      // Check if the user has already voted to kick the user
      const userKicked = await (socket.data.user as User)
        .related('kicksGiven')
        .query()
        .where('voted_for_id', kickedUser.id)
        .where('channel_id', channel.id)
        .first()
      if (userKicked) {
        socket.emit('error', 'You already voted for kicking this user')
        return
      }

      // Add the vote to the user
      await (socket.data.user as User).related('kicksGiven').attach({
        [kickedUser.id]: {
          channel_id: channel.id,
        },
      })

      // Check if the user has already been voted for 3 times
      const voteCount = await kickedUser
        .related('kicksReceived')
        .query()
        .where('channel_id', channel.id)
        .count('* as total')

      const totalVotes = voteCount[0].$extras.total
      io.to('user-' + socket.data.user.id.toString()).emit('kickUserSuccess', {})

      // If user has 3 or more votes, remove them from channel
      if (totalVotes >= 3) {
        await kickedUser.related('channels').detach([channel.id])
        await kickedUser.related('kicksReceived').query().where('channel_id', channel.id).delete()
        await kickedUser.related('bans').attach([channel.id])

        // Notify users
        io.to('user-' + kickedUser.id.toString()).emit('channelRevoked', channel.id)
        io.to('channel-' + channel.id).emit('userBanned', {
          userNickname: kickedUser.nickname,
          channelId: channel.id,
        })
      }
    })
  })
})
