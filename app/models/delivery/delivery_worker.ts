import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import DeliveryOrder from '#models/delivery/delivery_order'

export default class DeliveryWorker extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare phone: string

  @column()
  declare location: string

  @column()
  declare status: 'available' | 'unavailable' | 'on_delivery'

  @hasMany(() => DeliveryOrder)
  declare deliveryOrders: HasMany<typeof DeliveryOrder>


  // methods -----------------------
  // find delivery orders that are currently assigned

  public async getAssignedOrders(): Promise<DeliveryOrder[]> {
    return this.deliveryOrders.query().where('status', 'assigned').all()
  }

  public getLocation(){
    const location = JSON.parse(this.location)
    return location
  }

}
