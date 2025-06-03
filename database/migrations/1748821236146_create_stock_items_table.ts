import { BaseSchema } from '@adonisjs/lucid/schema'


export default class extends BaseSchema {
  protected tableName = 'stock_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('unit').notNullable() // e.g. grams, ml, pcs
      table.integer('quantity').notNullable().unsigned() // available stock
      table.integer('low_stock').unsigned().defaultTo(0)
      table.timestamps(true) // created_at, updated_at
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}