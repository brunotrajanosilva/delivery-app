import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cart_item_extras'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('cart_item_id')
        .unsigned()
        .references('id')
        .inTable('cart_items')
        .onDelete('CASCADE')

      table.integer('extra_id').unsigned().references('id').inTable('extras').onDelete('CASCADE')

      table.integer('quantity').notNullable()

      table.timestamps()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
