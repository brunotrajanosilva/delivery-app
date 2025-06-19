import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
// import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import {Decimal} from 'decimal.js'

import { TransactionClientContract } from '@adonisjs/lucid/types/database'


export default class Coupon extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare discountType: 'percentage' | 'flat'

  @column()
  declare discountValue: string

  @column()
  declare startDate: string

  @column()
  declare endDate: string

  @column()
  // decrease the quantity when a coupon is used. null means unlimited
  declare quantity: number

  @column()
  declare minimumPurchase: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime


  /********* Methods *********/

  static async findByCode(code: string) {
    const coupon = await this.query().where('code', code).first()
    if (!coupon) {
      throw new Error('coupon not found')
    }
    return coupon
  }

  private isExpired(): boolean {
    const now = new Date()
    return now > new Date(this.endDate)
  }

  private isUsed(): boolean {
    return this.quantity != null && this.quantity <= 0
  }

  private isUnderMinimumPurchase(total: Decimal): boolean {
    const minimumPurchase = new Decimal(this.minimumPurchase)
    return total.lessThan( minimumPurchase )
  }

  // logic
  private validateCoupon(total: Decimal) {

    if (this.isExpired()) {
      throw new Error('coupon expired')
    }

    if (this.isUsed()) {
      throw new Error('coupon usage limit reached')
    }

    if (this.isUnderMinimumPurchase(total)) {
      throw new Error('minimum purchase not met')
    }

    // validate discount basead on type. percentage can't be 1.0; flat can't be 0
  }

  private calcDiscount(total: Decimal) {
    if (this.discountType === 'percentage') {
      const discountPercentage = new Decimal(this.discountValue)
      return total.mul(discountPercentage)
    }

    if (this.discountType === 'flat') {
      const discountFlat = new Decimal( this.discountValue )

      return discountFlat
    }

    throw new Error('invalid discount type')
  }

  public async use(trx?: TransactionClientContract) {
    if (this.quantity != null) {
      this.quantity -= 1
    }

    if (trx){
      this.useTransaction(trx)
    }

    await this.save()
  }

  public apply(total: Decimal): Decimal {
    // const decimalTotal = new Decimal(total)
    this.validateCoupon(total)
    const discount = this.calcDiscount(total)
    // this.use()

    return discount
  }

}
