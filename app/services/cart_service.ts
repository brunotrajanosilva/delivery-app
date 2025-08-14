import CartItem from '#models/user/cart_item'
import Coupon from '#models/user/coupon'
import Order from '#models/user/order'
import OrderItem from '#models/user/order_item'

import { DateTime } from 'luxon'

import StockService from '#services/stock_service'

import { Decimal } from 'decimal.js'
import { OrderItemDetails } from '#types/order'
import { TransactionClientContract } from '@adonisjs/lucid/types/database'
export default class CartService {
  private readonly cartItem: typeof CartItem
  private readonly coupon: typeof Coupon
  private readonly stockService: StockService
  private checkoutCart: CartItem[]
  private checkoutCartTotal: Decimal
  private couponInstance: Coupon | null

  constructor(cartItem: typeof CartItem, coupon: typeof Coupon, stockService: StockService) {
    this.cartItem = cartItem
    this.coupon = coupon

    this.stockService = stockService

    this.checkoutCart = []
    this.checkoutCartTotal = new Decimal('0')
    this.couponInstance = null
  }

  private async setCheckoutCart(cartItemIds: number[]): Promise<void> {
    const checkoutCart = await this.cartItem
      .query()
      .whereIn('id', cartItemIds)
      .preload('variation', (query) => {
        query.preload('product')
        query.preload('recipe')
      })
      .preload('cartItemExtras', (query) => {
        query.preload('extra')
      })
      .exec()

    // console.log(checkoutCart)

    this.checkoutCart = checkoutCart
  }
  private setCheckoutCartPrice(): void {
    let checkoutCartTotal = new Decimal('0')

    for (const cartItem of this.checkoutCart) {
      const cartItemTotal = cartItem.calcCartItemTotalPrice()
      checkoutCartTotal = checkoutCartTotal.add(cartItemTotal)
    }
    this.checkoutCartTotal = checkoutCartTotal
  }

  private async setCoupon(couponCode: string): Promise<void> {
    let couponInstance = await this.coupon.findByCode(couponCode)
    couponInstance.apply(this.checkoutCartTotal)
    this.couponInstance = couponInstance
  }

  public getCheckoutCartTotal(): Decimal {
    if (this.couponInstance === null) return this.checkoutCartTotal

    const total = this.checkoutCartTotal.sub(this.couponInstance.discount)
    return total
  }

  public getCheckoutCart(): CartItem[] {
    return this.checkoutCart
  }

  public getCheckoutCartResponse() {
    const result = {
      checkoutCart: this.checkoutCart,
      checkoutCartTotal: this.checkoutCartTotal,
      couponDiscount: this.couponInstance?.discount || null,
      total: this.getCheckoutCartTotal(),
    }
    return result
  }

  public async start(cartItemIds: number[], couponCode: string | null = null): Promise<void> {
    await this.setCheckoutCart(cartItemIds)
    this.stockService.start(this.getCheckoutCart())

    const hasStocks = this.stockService.hasStocks()
    if (!hasStocks) throw new Error('Not enough stock')

    this.setCheckoutCartPrice()

    if (couponCode === null) return
    this.setCoupon(couponCode)
  }

  //   FINISH CHECKOUT TO ORDER =====================================
  public formatOrder(): Partial<Order> {
    const expirationDate = DateTime.now().plus({ minutes: 30 })
    return {
      totalPrice: this.checkoutCartTotal.toString(),
      totalToPay: this.getCheckoutCartTotal().toString(),
      couponId: this.couponInstance?.id || undefined,
      couponDiscount: this.couponInstance?.discount.toString() || undefined,
      expirationDate: expirationDate,
      status: 'processing',
      stocks: this.stockService.getFormatedStocks(),
    }
  }

  public formatOrderItems(): Partial<OrderItem>[] {
    const formatOrderItems = []

    for (const cartItem of this.checkoutCart) {
      const details: OrderItemDetails = {
        product: {
          id: cartItem.variation.product.id,
          name: cartItem.variation.product.name,
          price: cartItem.variation.product.price,
          description: cartItem.variation.product.description,
        },
        variation: {
          id: cartItem.variation.id,
          name: cartItem.variation.name,
          price: cartItem.variation.price,
          isRecipe: cartItem.variation.isRecipe,
        },
        extras: cartItem.cartItemExtras.map((cartExtra) => {
          return {
            id: cartExtra.extra.id,
            name: cartExtra.extra.name,
            price: cartExtra.extra.price,
            quantity: cartExtra.quantity,
          }
        }),
      }

      const cartItemFormated: Partial<OrderItem> = {
        variationId: cartItem.variation.id,
        details: details,
        quantity: cartItem.quantity,
        total: cartItem.total.toString(),
      }

      formatOrderItems.push(cartItemFormated)
    }
    return formatOrderItems
  }

  public async finishCheckout(trx: TransactionClientContract): Promise<void> {
    const promises = []
    promises.push(this.stockService.reserveStocks())

    const deleteCartItems = this.checkoutCart.map((cartItem) => cartItem.delete())
    promises.push(...deleteCartItems)

    if (this.couponInstance) promises.push(this.couponInstance.use(trx))

    await Promise.all(promises)
  }
}
