// import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import { BaseSchema } from "@adonisjs/lucid/schema"

export default class CategoryProduct extends BaseSchema {
  protected tableName = 'category_product'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      
      // Foreign keys
      table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE')
      table.integer('category_id').unsigned().references('id').inTable('categories').onDelete('CASCADE')
      
      // Ensure a product can't be in the same category twice
      table.unique(['product_id', 'category_id'])
      
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}