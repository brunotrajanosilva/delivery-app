import { DateTime } from 'luxon'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'delivery_workers'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('phone').notNullable()
      table.string('location').nullable()
      table.string('status').defaultTo('available') //['available', 'unavailable', 'on_delivery']
      table.timestamps(true)
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
