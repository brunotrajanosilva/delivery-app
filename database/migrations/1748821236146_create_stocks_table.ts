import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stocks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('item_id').unsigned().notNullable()
      table.string('item_type').notNullable()
      // table.string('name').notNullable()
      // table.string('unit').notNullable() // e.g. grams, ml, pcs
      table.integer('available').notNullable().unsigned()
      table.integer('reserved').notNullable().unsigned()
      table.integer('low_stock').unsigned().defaultTo(0)
      table.timestamps(true) // created_at, updated_at
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
