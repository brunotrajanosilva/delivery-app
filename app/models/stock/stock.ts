import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'

export default class Stock extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare itemId: number

  @column()
  declare itemType: 'variation' | 'ingredient'

  @column()
  declare available: number

  @column()
  declare reserved: number

  @column()
  declare lowStock: number

  // @hasMany(() => Recipe)
  // declare recipes: HasMany<typeof Recipe>

  // reforce the onetoone. itemid and itemType shouldbe unique together.

  // low stock should be less than quantity
  // methods
  //   public static async getLowStocks() {
  //     return this.query().whereRaw('quantity < low_stock')
  //   }

  //   public hasStock(quantityRequested: number): boolean {
  //     if (this.available < quantityRequested) {
  //       return false
  //       //   throw new Error(`Insufficient stock for ingredient ID ${this.id}. Required: ${quantityRequested}, Available: ${this.quantity || 0}`)
  //     }
  //     return true
  //   }

  //   public reserveStocks(stocks) {
  //     for (stock in stocks) {
  //     }
  //   }

  //   public returnReservedStocks() {}

  //   public discountReservedStocks() {}

  //   public async addQuantity(amount: number) {
  //     this.quantity += amount
  //     const result = await this.save()

  //     if (!result) {
  //       throw new Error(`can't add quantity to stock ID ${this.id}`)
  //     }
  //     return result
  //   }

  //   public async subtractQuantity(amount: number) {
  //     this.quantity -= amount
  //     const result = await this.save()

  //     if (!result) {
  //       throw new Error(`can't subtract quantity to stock ID ${this.id}`)
  //     }
  //     return result
  //   }
}
