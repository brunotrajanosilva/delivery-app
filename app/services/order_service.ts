import Order from '#models/user/order'
import CartService from '#services/cart_service'
import StockService from '#services/stock_service'
import db from '@adonisjs/lucid/services/db'

import type { OrderJobPayload } from '#types/job/order'
import Coupon from '#models/user/coupon'
export default class OrderService {
  private orderModel: typeof Order
  private cartService: CartService
  //   private cartServiceInstance: CartService | null

  constructor(orderModel: typeof Order, cartService: CartService) {
    this.orderModel = orderModel
    this.cartService = cartService
  }

  public async createOrder(orderPayload: OrderJobPayload): Promise<void> {
    await this.cartService.start(orderPayload.cartItemIds, orderPayload.couponCode)

    await db.transaction(async (trx) => {
      const paymentMethod = await this.createPayment(orderPayload.paymentGateway)

      const formatOrder = this.cartService.formatOrder()
      formatOrder.paymentMethod = paymentMethod
      formatOrder.paymentGateway = orderPayload.paymentGateway
      formatOrder.userId = orderPayload.userId

      const formatOrderItems = this.cartService.formatOrderItems()

      const order = await this.orderModel.create(formatOrder as any, { client: trx })
      await order.related('items').createMany(formatOrderItems as any, { client: trx })

      await this.cartService.finishCheckout(trx)
    })
  }

  private async createPayment(orderPaymentGateway: string): Promise<string> {
    return 'payment_id39032049'
  }

  public async cancelOrder(
    orderId: number,
    coupon: typeof Coupon,
    stockService: StockService
  ): Promise<void> {
    const order = await this.orderModel.query().where('id', orderId).first()
    if (!order) throw new Error('Order not found')

    const promises = []

    if (order.couponId) {
      promises.push(coupon.refund(order.couponId))
    }

    promises.push(stockService.refundStocks(order.stocks))

    order.status = 'cancelled'
    promises.push(order.save())

    await Promise.all(promises)
  }
  // private CouponModel: typeof Coupon,
  // private cartServiceInstance: CartService,
  // private stockServiceInstance: StockService,
  // private paymentManagerInstance: GatewayManager,
  // private OrderModel: typeof Order,
  // private OrderItemModel: typeof OrderItem

  /* private async createOrderItem(order: Order, cartItem: CartItem, trx: any) {
    const orderItemData = {
      orderId: order.id,
      productId: cartItem.productId,
      productDescription: cartItem.product.productDescription(),
      details: cartItem.details,
      quantity: cartItem.quantity,
      total: cartItem.total,
    }

    // const orderItem = await order.related('items').create(orderItemData,  {client: trx})
    const orderItem = await this.OrderItemModel.create(orderItemData, { client: trx })
    if (!orderItem) {
      throw new Error('Error creating order item')
    }
  }

  private calculateItemsTotalPrice(cartItems: any): Decimal {
    let totalPrice = new Decimal('0.00')

    for (const cartItem of cartItems) {
      totalPrice = totalPrice.plus(new Decimal(cartItem.total))
    }

    if (totalPrice.lessThanOrEqualTo('0')) {
      throw new Error('Total price must be greater than zero')
    }

    return totalPrice
  } */

  /* private async createOrder(
    user: User,
    cartItems: CartItem[],
    gateway: GatewayAbstract,
    gatewayName: string,
    coupon: Coupon | null,
    items: Map<Stock, number>
  ) {
    const totalPrice = this.calculateItemsTotalPrice(cartItems)

    let orderValues: Partial<Order> = {
      userId: user.id,
      totalPrice: totalPrice.toString(),
      totalToPay: totalPrice.toString(),
      paymentStatus: 'pending',
      paymentGateway: gatewayName,
      paymentMethod: '', // change after create the payment
    }

    if (coupon) {
      const discountValue = coupon.apply(totalPrice)
      orderValues.couponId = coupon.id
      orderValues.couponDiscount = discountValue.toString()
      orderValues.totalToPay = totalPrice.sub(discountValue).toString()
    }

    const order = await db.transaction(async (trx) => {
      const order = await this.OrderModel.create(orderValues, { client: trx })

      for (const cartItem of cartItems) {
        await this.createOrderItem(order, cartItem, trx)
      }

      if (coupon) {
        await coupon.use(trx)
      }

      const paymentIntent = await gateway.createPayment(order.id, order.totalToPay, 'BRL')
      order.paymentMethod = paymentIntent.id
      await order.save()

      for (const cartItem of cartItems) {
        cartItem.useTransaction(trx)
        await cartItem.delete()
      }

      await this.stockServiceInstance.reserveStocks(items, trx)

      return order
    })

    return order
  }

  // composition
  public async finishOrder(user: User, body: OrderItemPayload): Promise<Order> {
    const cartItemsIds = body.cartItemsIds
    const cartItems = await this.cartServiceInstance.getSelectedCartItems(cartItemsIds)

    const gateway = this.paymentManagerInstance.use(body.paymentGateway)
    const coupon = body.couponCode
      ? await this.CouponModel.query().where('code', body.couponCode).first()
      : null

    const itemsStocks = await this.stockServiceInstance.getItemsStocks(cartItems)
    const hasStock = this.stockServiceInstance.hasStocks(itemsStocks)

    if (!hasStock) {
      throw new Error('There is no stocks available')
    }

    const createOrder = await this.createOrder(
      user,
      cartItems,
      gateway,
      body.paymentGateway,
      coupon,
      itemsStocks
    )

    return createOrder
  }

  public async setOrderStatus(orderId: number, status: OrderStatusType) {
    this.OrderModel.validatePaymentStatus(status)

    const order = await this.OrderModel.find(orderId)

    if (!order) {
      throw new Error('Order not found')
    }

    order.paymentStatus = status
    await order.save()
    return order
  } */
}
