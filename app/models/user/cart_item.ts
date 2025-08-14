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

  declare total: Decimal

  // CHECKOUT ======================================================

  private calcVariationPrice(): Decimal {
    const productPrice = new Decimal(this.variation.product.price)
    const variationPrice = productPrice.mul(this.variation.price)
    return variationPrice
  }

  private calcCartItemExtrasPrice(): Decimal {
    let extrasPrice = new Decimal('0')
    for (const cartItemExtra of this.cartItemExtras) {
      const extraPrice = new Decimal(cartItemExtra.extra.price)
      const cartItemExtraPrice = extraPrice.mul(cartItemExtra.quantity)
      extrasPrice = extrasPrice.add(cartItemExtraPrice)
    }
    return extrasPrice
  }

  public calcCartItemTotalPrice(): Decimal {
    let cartItemTotal = new Decimal('0')
    const variationPrice = this.calcVariationPrice()
    cartItemTotal = cartItemTotal.add(variationPrice)

    if (this.cartItemExtras.length > 0) {
      const extrasPrice = this.calcCartItemExtrasPrice()
      cartItemTotal = cartItemTotal.add(extrasPrice)
    }

    cartItemTotal = cartItemTotal.mul(this.quantity)
    this.total = cartItemTotal

    return cartItemTotal
  }
}
