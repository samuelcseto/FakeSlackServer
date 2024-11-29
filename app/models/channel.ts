import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import Message from '#models/message'
import { type ManyToMany, type BelongsTo, type HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare private: boolean

  @column()
  declare authorId: number

  @column.dateTime({ autoCreate: true })
  declare lastActivity: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'authorId',
  })
  declare author: BelongsTo<typeof User>

  @hasMany(() => Message, {
    foreignKey: 'channelId',
  })
  declare messages: HasMany<typeof Message>

  @manyToMany(() => User, {
    pivotTable: 'channel_users',
  })
  declare users: ManyToMany<typeof User>
}
