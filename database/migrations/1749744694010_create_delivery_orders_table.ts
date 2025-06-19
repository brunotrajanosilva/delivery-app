import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'delivery_orders'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('order_id')
        .unsigned()
        .references('id')
        .inTable('orders')
        .onDelete('CASCADE')

        table
        .integer('delivery_worker_id')
        .unsigned()
        .references('id')
        .inTable('delivery_workers')
        .onDelete('CASCADE')

      table.string('status').defaultTo('pending') //, ['pending', 'assigned', 'in_transit', 'delivered', 'failed'])
      table.string('location').notNullable()
      table.integer('distance_km').notNullable()
      table.timestamp('assigned_at').nullable()
      table.timestamp('delivered_at').nullable()
      table.timestamps(true)
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}