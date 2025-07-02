import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import DeliveryWorker from "#models/delivery/delivery_worker"
import Order from '#models/user/order'

import { DateTime } from 'luxon'

import { TIME_DISTANCE_REPRESENTATION, TOLERANCE, TIME_PONDERATION_FACTOR } from '#modules/delivery/constants'


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
  declare assignedAt?: DateTime

  @column.dateTime()
  declare deliveredAt?: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => DeliveryWorker)
  declare deliveryWorker: BelongsTo<typeof DeliveryWorker>


  // TimeDistance: representation of kilometers in time. Example: 1km - 1 min

  // Tolerance: tolerance for each kilometers. Example: tolerance = 200%. so will be 2min for each km

  // TimeToDelivery: time(distance_km from startPoint) * Tolerance - timeDistance passed since order creation


  // private timeToDelivery: number | null = null
  private timePassed: number | null = null

  //  static
  // public static calcTimeDistance(distance: number){
  //   return distance * TIME_DISTANCE_REPRESENTATION
  // }
  // methods
  public getLocation(){
    const location = JSON.parse(this.location)
    return location
  }

  public getTimePassed(): number{
    if (this.timePassed === null){
      const now = DateTime.now()
      const createdAt = this.createdAt || now

      this.timePassed = now.diff(createdAt, 'minutes').minutes    
    }

    return this.timePassed
  }

  public getTimePenalty(): number{
    return this.getTimePassed() * TIME_PONDERATION_FACTOR
  }

  /* public getTimeToDelivery(): number{

    if (this.timeToDelivery != null){
      return this.timeToDelivery
    }


    const timeDistance = this.distance_km * TIME_DISTANCE_REPRESENTATION
    const timeTolerated = timeDistance * TOLERANCE
    // console.log(timeDistance)

    const timePassed = this.getTimePassed()
    // console.log(timePassed)

    const timeToDelivery = timeTolerated - timePassed

    this.timeToDelivery = timeToDelivery
    return timeToDelivery
  } */
}