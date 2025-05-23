import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { HasMany } from '@adonisjs/lucid/types/relations'

import User from '#models/user'
import Product from '#models/product'
import Variation from '#models/variation'
import CartItemExtra from '#models/cart_item_extra'


// json request body
/* 

CartItem: {
  productId: number
  quantity: number
  detail: {
    variation: number
    extras: [extraId: number, quantity: number]
  }
}



*/

export default class CartItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare productId: number

  @column()
  declare variationId: number

  @column()
  declare quantity: number

  @column()
  declare total: number

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => Variation)
  declare variation: BelongsTo<typeof Variation>

  @hasMany(() => CartItemExtra)
  declare extras: HasMany<typeof CartItemExtra>

  @column.dateTime({ autoCreate: true })
  declare createdAt: Date

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: Date

  // validate
  static validadeQuantity(quantity: number) {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0')
    }

    return true
  }
}
