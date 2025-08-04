import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateCartItems extends BaseSchema {
  protected tableName = 'cart_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')

      table
        .integer('variation_id')
        .unsigned()
        .references('id')
        .inTable('variations')
        .onDelete('CASCADE')

      table.integer('quantity').notNullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
