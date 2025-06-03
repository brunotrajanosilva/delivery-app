import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, HasMany } from '@adonisjs/lucid/orm'
import Recipe from './recipe'

export default class StockItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare unit: string

  @column()
  declare quantity: number

  @column()
  declare low_stock: number

  @hasMany(() => Recipe)
  declare recipes: HasMany<typeof Recipe>


  // low stock should be less than quantity
  // methods
  public static async getLowStocks(){
    return this.query().whereRaw('quantity < low_stock')
  }

  public async addQuantity(amount: number) {
    this.quantity += amount
    await this.save()
  }

  public async subtractQuantity(amount: number) {
    this.quantity -= amount
    await this.save()
  }
}
