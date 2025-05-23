import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
// import type { BelongsTo } from '@adonisjs/lucid/types/relations'


export default class Coupon extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare discountType: 'percentage' | 'flat'

  @column()
  declare discountValue: number

  @column()
  declare startDate: string

  @column()
  declare endDate: string

  @column()
  // decrease the quantity when a coupon is used. null means unlimited
  declare quantity: number

  @column()
  declare minimumPurchase: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime


  /********* Methods *********/

  static async findByCode(code: string) {
    const coupon = this.query().where('code', code).first()
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

  private isUnderMinimumPurchase(total: number): boolean {
    return total < this.minimumPurchase
  }

  // logic
  private validateCoupon(total: number) {

    if (this.isExpired()) {
      throw new Error('coupon expired')
    }

    if (this.isUsed()) {
      throw new Error('coupon usage limit reached')
    }

    if (this.isUnderMinimumPurchase(total)) {
      throw new Error('minimum purchase not met')
    }
  }

  private calcDiscount(total: number): number {
    if (this.discountType === 'percentage') {
      return total * (this.discountValue / 100)
    }

    if (this.discountType === 'flat') {
      return this.discountValue
    }

    throw new Error('invalid discount type')
  }

  private use() {
    if (this.quantity != null) {
      this.quantity -= 1
    }
  }

  public async apply(total: number) {
    this.validateCoupon(total)
    const discount = this.calcDiscount(total)
    this.use()

    return {
      coupon: this,
      discount,
    }
  }

}
