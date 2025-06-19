import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import DeliveryWorker from "#models/delivery/delivery_worker"
import Order from '#models/user/order'

export default class DeliveryOrder extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare orderId: number

  @column()
  declare deliveryWorkerId?: number

  @column()
  declare status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed'

  @column()
  declare location: string

  @column()
  declare distance_km: number

  @column.dateTime()
  declare assignedAt?: Date

  @column.dateTime()
  declare deliveredAt?: Date

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => DeliveryWorker)
  declare deliveryWorker: BelongsTo<typeof DeliveryWorker>

  // method
  public getLocation(){
    const location = JSON.parse(this.location)
    return location
  }
}