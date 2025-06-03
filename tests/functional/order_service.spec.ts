// tests/unit/order_service.spec.ts

import { test } from '@japa/runner'
import OrderService from '#services/order_service'
import CartService from '#services/cart_service'
import CouponService from '#services/coupon_service'

import Product from '#models/product'
import Coupon from '#models/coupon'
import User from '#models/user'
import CartItem from '#models/cart_item'
import Order from '#models/order'
import OrderItem from '#models/order_item'

import { Decimal } from 'decimal.js'
import testUtils from '@adonisjs/core/services/test_utils'


// create two products
const product1 = await Product.create({
  name: 'Hamburguer',
  price: '50',
})

const product2 = await Product.create({
  name: 'Pizza',
  price: '30',
})




const newCoupon = await Coupon.create({
  code: 'WELCOME20',
  discountType: 'percentage',
  discountValue: '.20',
  startDate: new Date(Date.now() - 10000).toISOString(),
  endDate: new Date(Date.now() + 60_000).toISOString(),
  quantity: 100,
  minimumPurchase: '50',
})

const newUser = await User.create({
  name: 'John Doe',
  address: '123 Main St, Cityville',
  email: 'john@example.com',
  password: 'securePassword123',
})

const cartItem1 = await CartItem.create({
  userId: newUser.id, 
  productId: product1.id,
  quantity: 2,
  total: "100",
})

const cartItem2 = await CartItem.create({
  userId: newUser.id, 
  productId: product2.id,
  quantity: 1,
  total: "50.50",
})


const mockPaymentManager = {
    use: (mocString: string) => ({
        createPayment: async (orderId: number, amount: number, currency: string) => ({
            id: `pi_test_${orderId}`,
        }),
    }),
}

test.group('OrderService', (group) => {
  group.each.setup(async () => {
    group.each.setup(() => testUtils.db().withGlobalTransaction())
  })

  test('createOrder creates order with mocked dependencies', async ({ assert }) => {



    const cartService = new CartService()
    const service = new OrderService(Coupon, cartService, mockPaymentManager)

    const order = await service.createOrder(newUser, {
      paymentGateway: 'mock',
      couponCode: 'WELCOME20',
    })

    assert.exists(order.id)
    assert.isTrue(new Decimal(order.totalPrice).equals(new Decimal("150.50")))
    assert.isTrue(new Decimal(order.totalToPay).equals(new Decimal("120.40")))
    assert.isTrue(new Decimal(order.couponDiscount).equals(new Decimal("30.10")))
    assert.equal(order.couponId, newCoupon.id)
    assert.equal(order.paymentMethod, 'pi_test_1')

    // orderItems
    const orderItems = await OrderItem.query().where('orderId', order.id).orderBy('id', 'asc')
    assert.equal(orderItems.length, 2)
    assert.equal(orderItems[0].productId, cartItem1.productId)
    assert.isTrue(new Decimal(orderItems[0].total).equals(new Decimal(cartItem1.total)))
   
  })

  // Fail tests
  test('createOrder throws error if coupon is invalid', async ({ assert }) => {
    const cartService = new CartService()
    const service = new OrderService(Coupon, cartService, mockPaymentManager)

    const order = service.createOrder(newUser, {
      paymentGateway: 'mock',
      couponCode: 'WELCME20',
    })

    await assert.rejects(async () => order, 'Coupon not found')
  })

  // cancel transaction with mocked coupon use()
  test("createOrder cancels transaction when something fails", async ({ assert }) => {

    const cartService = new CartService()
    const service = new OrderService(Coupon, cartService, mockPaymentManager)


    // coupon fail
    const originalCouponUse = Coupon.prototype.use
    
    Coupon.prototype.use = async () => {
      throw new Error('Coupon use failed')
    }

    const couponUseFail = service.createOrder(newUser, {
      paymentGateway: 'mock',
      couponCode: 'WELCOME20',
    })

    await assert.rejects(async () => couponUseFail, 'Coupon use failed')
    Coupon.prototype.use = originalCouponUse


    // gatway fail
    const originalPaymentManagerUse = mockPaymentManager.use

    mockPaymentManager.use = (mocString: string) => ({
      createPayment: async (orderId: number, amount: number, currency: string) => {
        throw new Error("Payment gateway error")       
      },
    })

    const gatewayFail = service.createOrder(newUser, {
      paymentGateway: 'mock',
      couponCode: 'WELCOME20',
    })

    await assert.rejects(async () => gatewayFail, 'Payment gateway error')
    mockPaymentManager.use = originalPaymentManagerUse


  })

  // setOrderStatus
  test('setOrderStatus updates order status', async ({ assert }) => {
    const cartService = new CartService()
    const service = new OrderService(Coupon, cartService, mockPaymentManager)

    const order = await service.createOrder(newUser, {
      paymentGateway: 'mock',
      couponCode: 'WELCOME20',
    })

    // Update the order status
    const updatedOrder = await service.setOrderStatus(order.id, 'paid')

    assert.equal(updatedOrder.paymentStatus, 'paid')

    const orderNotFound = service.setOrderStatus(9999, 'paid')
    await assert.rejects(async () => orderNotFound, 'Order not found')

  })
})
