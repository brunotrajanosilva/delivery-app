import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import CartItem from '#models/user/cart_item'
import Extra from '#models/product/extra'

export default class CartItemExtra extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare cartItemId: number

  @column()
  declare extraId: number

  @column()
  declare quantity: number

  @belongsTo(() => CartItem)
  declare cartItem: BelongsTo<typeof CartItem>

  @belongsTo(() => Extra)
  declare extra: BelongsTo<typeof Extra>
}
