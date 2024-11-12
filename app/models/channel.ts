import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import Message from '#models/message'
import { type BelongsTo, type HasMany } from '@adonisjs/lucid/types/relations'
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

  @belongsTo(() => User, {
    foreignKey: 'authorId',
  })
  declare author: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Message, {
    foreignKey: 'channelId',
  })
  declare messages: HasMany<typeof Message>
}
