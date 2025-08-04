import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

import User from '#models/user/user'
import Variation from '#models/product/variation'
import CartItemExtra from '#models/user/cart_item_extra'
import { Decimal } from 'decimal.js'

export default class CartItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare quantity: number

  @column()
  declare variationId: Variation

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Variation)
  declare variation: BelongsTo<typeof Variation>

  @hasMany(() => CartItemExtra)
  declare cartItemExtras: HasMany<typeof CartItemExtra>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // CHECKOUT ======================================================

  public static async queryCheckoutCart(cartItemIds: number[]): Promise<CartItem[]> {
    const cartItems = await CartItem.query()
      .whereIn('id', cartItemIds)
      .preload('variation', (query) => {
        query.preload('product')
      })
      .preload('cartItemExtras', (query) => {
        query.preload('extra')
      })

    return cartItems
  }

  public static calcCheckoutTotal(checkoutCart: CartItem[]): Decimal {
    const checkoutCartTotal = new Decimal('0')

    for (const cartItem of checkoutCart) {
      const cartItemTotal = new Decimal('0')
      const variationPrice = cartItem.calcVariationPrice()
      const extrasPrice = cartItem.calcCartItemExtrasPrice()
      cartItemTotal.add(variationPrice)
      cartItemTotal.add(extrasPrice)
      cartItemTotal.mul(cartItem.quantity)

      checkoutCartTotal.add(cartItemTotal)
    }
    return checkoutCartTotal
  }

  private calcVariationPrice(): Decimal {
    const productPrice = new Decimal(this.variation.product.price)
    const variationPrice = productPrice.add(new Decimal(this.variation.price))
    return variationPrice
  }

  private calcCartItemExtrasPrice(): Decimal {
    const extrasPrice = new Decimal('0')
    for (const cartItemExtra of this.cartItemExtras) {
      const extraPrice = new Decimal(cartItemExtra.extra.price)
      const cartItemExtraPrice = extraPrice.mul(cartItemExtra.quantity)
      extrasPrice.add(cartItemExtraPrice)
    }
    return extrasPrice
  }
}
