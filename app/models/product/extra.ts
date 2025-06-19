import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Product from '#models/product/product'
import Ingredient from '#models/stock/ingredient'

export default class Extra extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare price: string

  @column()
  declare quantity: number // this quantity will be discounted to stock

  @column()
  declare productId: number

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>
  
  @column()
  declare ingredientId: number

  @belongsTo(() => Ingredient)
  declare ingredient: BelongsTo<typeof Ingredient>

  // validation
  
}
