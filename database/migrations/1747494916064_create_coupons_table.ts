import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Coupons extends BaseSchema {
  protected tableName = 'coupons'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('code').notNullable().unique()
      table.string('discount_type').notNullable()
      table.decimal('discount_value', 10, 2).notNullable()
      table.integer('quantity').defaultTo(100).nullable()
      table.decimal('minimum_purchase', 10, 2).defaultTo(0).notNullable()
      // table
      //   .integer('category_id')
      //   .unsigned()
      //   .references('id')
      //   .inTable('categories')
      //   .onDelete('SET NULL')
      //   .nullable()
      
      table.date('start_date').notNullable()
      table.date('end_date').notNullable()

      table.timestamps(true)
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
