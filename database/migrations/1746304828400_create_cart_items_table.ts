import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateCartItems extends BaseSchema {
  protected tableName = 'cart_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table
        .integer('product_id')
        .unsigned()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')

      // table
      //   .integer('variation_id')
      //   .unsigned()
      //   .references('id')
      //   .inTable('variations')
      //   .onDelete('CASCADE')

      table.string("details").notNullable().defaultTo("")

      table.integer('quantity').notNullable()

      table.decimal('total', 10, 2).notNullable().defaultTo(0)

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
