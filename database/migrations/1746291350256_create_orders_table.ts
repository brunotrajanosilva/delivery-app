import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateOrders extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.uuid('uuid').notNullable().unique()

      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.decimal('total_price', 10, 2).notNullable()
        
      table.integer('coupon_id').unsigned().references('id').inTable('coupons').onDelete('SET NULL').nullable()
      table.decimal('coupon_discount', 10, 2).nullable().comment('Discount applied from coupon')
      
      // payment
      table.decimal('total_to_pay', 10, 2).notNullable().comment('Final price after discount')
      table.string('payment_status').notNullable()
      table.string('payment_gateway').notNullable()
      table.string('payment_method').notNullable()
      table.date('expiration_date').nullable()
    
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }

  // to add
  // UUID
  // coupom: id reference to Coupom
  // coupomDiscount: number
  // totalToPay: number
  // paymentStatus: string
  // paymentGateway: string
  // paymentMethod: string
  // expirationDate: date

}
