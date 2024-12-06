import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_kicks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('voted_by_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('voted_for_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table
        .integer('channel_id')
        .unsigned()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}