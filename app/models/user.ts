import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import Message from '#models/message'
import Channel from '#models/channel'
import { type ManyToMany, type HasMany } from '@adonisjs/lucid/types/relations'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare firstName: string

  @column()
  declare lastName: string

  @column()
  declare nickname: string

  @column()
  declare email: string

  @column()
  declare status: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare notificationsOnlyMentions: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Message, {
    foreignKey: 'createdBy',
  })
  declare sentMessages: HasMany<typeof Message>

  @manyToMany(() => Channel, {
    pivotTable: 'channel_users',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'channel_id',
    pivotTimestamps: true,
  })
  declare channels: ManyToMany<typeof Channel>

  @manyToMany(() => User, {
    pivotTable: 'user_kicks',
    pivotForeignKey: 'voted_by_id',
    pivotRelatedForeignKey: 'voted_for_id',
    pivotTimestamps: true,
  })
  declare kicksGiven: ManyToMany<typeof User>

  @manyToMany(() => User, {
    pivotTable: 'user_kicks',
    pivotForeignKey: 'voted_for_id',
    pivotRelatedForeignKey: 'voted_by_id',
    pivotColumns: ['channel_id'],
    pivotTimestamps: true,
  })
  declare kicksReceived: ManyToMany<typeof User>

  @manyToMany(() => Channel, {
    pivotTable: 'user_bans',
    pivotForeignKey: 'ban_user_id',
    pivotRelatedForeignKey: 'channel_id',
    pivotTimestamps: true,
  })
  declare bans: ManyToMany<typeof Channel>

  static accessTokens = DbAccessTokensProvider.forModel(User)
}
