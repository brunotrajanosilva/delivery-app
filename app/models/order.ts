import { BaseModel, beforeCreate, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import OrderItem from '#models/order_item'
import Coupon from '#models/coupon'
import type { OrderStatusType } from '../types/order_status.js'
import { DateTime } from 'luxon'

import { v4 as uuidv4 } from 'uuid'



/* export default class Order extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare totalPrice: number

  @column()
  // change to string
  declare paymentStatus: OrderStatusType

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => OrderItem)
  declare items: HasMany<typeof OrderItem>

  @column.dateTime({ autoCreate: true })
  declare createdAt: Date

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: Date

  // to add
  // UUID
  // coupom: id reference to Coupom
  // coupomDiscount: number
  // totalToPay: number
  // paymentGateway: string
  // paymentMethod: string
  // expirationDate: date

} */

export default class Order extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare userId: number

  @column()
  declare totalPrice: string

  
  // coupon
  @column()
  declare couponId?: number

  @column()
  declare couponDiscount?: string


  // payment
  @column()
  declare totalToPay: string

  @column()
  declare paymentStatus: OrderStatusType

  @column()
  declare paymentGateway: string

  @column()
  declare paymentMethod: string



  @column.date()
  declare expirationDate: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => OrderItem)
  declare items: HasMany<typeof OrderItem>

  @belongsTo(() => Coupon)
  declare coupon: BelongsTo<typeof Coupon>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  public static assignUuid(user: User) {
    user.uuid = uuidv4()
  }

  // methods
  // validate paymentStatus
  static validatePaymentStatus(status: OrderStatusType): boolean {
    const validStatuses: OrderStatusType[] = ['pending', 'paid', 'cancelled']
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid payment status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`)
    }

    return validStatuses.includes(status)
  }
}

