import { test } from '@japa/runner'
import sinon from 'sinon'
import { Decimal } from 'decimal.js'
import db from '@adonisjs/lucid/services/db'

import OrderService from '#services/order_service'
import Order from '#models/user/order'
import OrderItem from '#models/user/order_item'
import CartService from '#services/cart_service'
import Coupon from '#models/user/coupon'
import CartItem from '#models/user/cart_item'
import User from '#models/user/user'
import { GatewayManager } from '#modules/payment/services/gateway_manager'
import GatewayAbstract from '#modules/payment/services/gateways/gateway_abstract'

import type { OrderItemPayload } from '#types/requests/order'
import { networkInterfaces } from 'os'
import paymentManager from '#modules/payment/payment_manager'

test.group('OrderService', (group) => {
  let orderService: OrderService
  let mockCouponModel: sinon.SinonStubbedInstance<typeof Coupon>
  let mockCartService: sinon.SinonStubbedInstance<CartService>
  let mockPaymentManager: sinon.SinonStubbedInstance<GatewayManager>
  let mockOrderModel: sinon.SinonStubbedInstance<typeof Order>
  let mockOrderItemModel: sinon.SinonStubbedInstance<typeof OrderItem>
  let mockGateway: any//sinon.SinonStubbedInstance<GatewayAbstract>
  let mockUser: User
  let mockCartItems: CartItem[]
  let mockCoupon: Coupon

  let mockTransaction: any
  let dbTransactionStub: sinon.SinonStub
  
  group.setup(() => {
    // Create stubs for all dependencies
    mockCouponModel = sinon.createStubInstance(Coupon.constructor as any)
    mockCartService = sinon.createStubInstance(CartService)
    mockPaymentManager = sinon.createStubInstance(GatewayManager)
    mockOrderModel = sinon.createStubInstance(Order.constructor as any)
    mockOrderModel.create = sinon.stub() as any
    mockOrderModel.find = sinon.stub() as any

    mockOrderItemModel = sinon.createStubInstance(OrderItem.constructor as any)
    mockOrderItemModel.create = sinon.stub() as any

    // mockGateway = sinon.createStubInstance(GatewayAbstract)
    class MockGateway {
        public createPayment = sinon.stub()
    }
    mockGateway = new MockGateway()


    // Setup database transaction stub
    mockTransaction = {
      id: 'mock-transaction-id',
      // Add any transaction-specific properties your code might use
      rollback: sinon.stub(),
      commit: sinon.stub()
    }
    dbTransactionStub = sinon.stub(db, 'transaction')

    // Create OrderService instance with mocked dependencies
    orderService = new OrderService(
      mockCouponModel as any,
      mockCartService as any,
      mockPaymentManager as any,
      mockOrderModel as any,
      mockOrderItemModel as any
    )

    // Create mock data
    mockUser = {
      id: 1,
      email: 'test@example.com'
    } as User

    mockCartItems = [
      {
        id: 1,
        productId: 1,
        quantity: 2,
        total: '29.98',
        details: { size: 'M' },
        product: {
          productDescription: () => 'Test Product 1'
        },
        useTransaction: sinon.stub().resolves(),
        delete: sinon.stub().resolves()
      } as any,
      {
        id: 2,
        productId: 2,
        quantity: 1,
        total: '15.50',
        details: { color: 'blue' },
        product: {
          productDescription: () => 'Test Product 2'
        },
        useTransaction: sinon.stub().resolves(),
        delete: sinon.stub().resolves()
      } as any
    ]

    mockCoupon = {
      id: 1,
      code: 'DISCOUNT10',
      apply: sinon.stub().returns(new Decimal('4.48')),
      use: sinon.stub().resolves()
    } as any
  })

  group.teardown(() => {
    sinon.restore()
  })

  group.each.teardown(() => {
    sinon.resetHistory()
  })

  test('should finish order successfully without coupon', async ({ assert }) => {
    const orderPayload = {
      cartItemsIds: [1, 2],
      paymentGateway: 'stripe'
    }

    // Setup mocks
    mockCartService.getSelectedCartItems.resolves(mockCartItems)
    mockPaymentManager.use.returns(mockGateway as any)

    const mockOrder = {
      id: 1,
      totalPrice: '45.48',
      totalToPay: '45.48',
      paymentStatus: 'pending',
      save: sinon.stub().resolves()
    }

    const mockPaymentIntent = { id: 'pi_test123' }
    mockGateway.createPayment.resolves(mockPaymentIntent as any)
    mockOrderModel.create.resolves(mockOrder as any)
    mockOrderItemModel.create.resolves({} as any)

    dbTransactionStub.callsFake(async (callback) => {
      const result = await callback(mockTransaction)
      return result
    })

    // dbTransactionStub.callsArgWith(0, {
    //   // Mock transaction object
    // }).resolves(mockOrder)

    const finishOrder = await orderService.finishOrder(mockUser, orderPayload)
    // console.log(finishOrder)
    // console.log(mockOrderModel.create.args)
    const mockOrderCreateArgs = {
      userId: mockUser.id,
      totalPrice: '45.48',
      totalToPay: '45.48',
      paymentStatus: "pending",
      paymentGateway: orderPayload.paymentGateway,
      paymentMethod: '',
    }

    // Assertions
    assert.exists(finishOrder)
    assert.equal(finishOrder, mockOrder)
    assert.equal(finishOrder?.paymentMethod, 'pi_test123')

    sinon.assert.calledOnce(mockOrder.save)
    sinon.assert.calledOnce(mockOrderModel.create)
    
    // assert.equal(mockOrderModel.create.getCall(0), mockOrderCreateArgs)
    sinon.assert.calledTwice(mockOrderItemModel.create)

    // trx
    sinon.assert.calledOnceWithExactly(mockOrderModel.create, mockOrderCreateArgs, {client: mockTransaction})
    assert.isTrue(mockOrderItemModel.create.calledWith(sinon.match.any, { client: mockTransaction }))
    sinon.assert.calledOnceWithExactly(mockCartItems[0].useTransaction, mockTransaction)

    // sinon.assert.calledOnce(mockOrderItemModel.create, {client: mockTransaction})
    // assert.deepEqual(mockOrderItemModel.create.firstCall.args[1], { client: mockTransaction })


    sinon.assert.calledOnceWithExactly(mockCartService.getSelectedCartItems, orderPayload.cartItemsIds)
    sinon.assert.calledOnceWithExactly(mockPaymentManager.use, orderPayload.paymentGateway)
    sinon.assert.calledOnce(mockCartItems[0].delete)
    assert.isTrue(dbTransactionStub.called)
  }),

  test('should finish order successfully with coupon', async ({ assert }) => {
    const orderPayload = {
      cartItemsIds: [1, 2],
      paymentGateway: 'stripe',
      couponCode: 'DISCOUNT10'
    }

    // Setup mocks
    mockCartService.getSelectedCartItems.resolves(mockCartItems)
    mockPaymentManager.use.returns(mockGateway as any)

    const mockOrder = {
      id: 1,
      totalPrice: '45.48',
      totalToPay: '41',
      paymentStatus: 'pending',
      save: sinon.stub().resolves()
    }

    const mockPaymentIntent = { id: 'pi_test123' }
    mockGateway.createPayment.resolves(mockPaymentIntent as any)
    mockOrderModel.create.resolves(mockOrder as any)
    mockOrderItemModel.create.resolves({} as any)


    
    const firstStub = sinon.stub().resolves(mockCoupon)
    const whereStub = sinon.stub().returns({ first: firstStub })
    const queryStub = sinon.stub().returns({ where: whereStub })

    mockCouponModel.query = queryStub as any
    
    /* mockCouponModel.query = sinon.stub().returns({
      where: sinon.stub().returns({
        first: sinon.stub().resolves(mockCoupon)
      })
    }) as any */

    // dbTransactionStub.callsArgWith(0, {
    //   // Mock transaction object
    // }).resolves(mockOrder)

    const finishOrder = await orderService.finishOrder(mockUser, orderPayload)

    // console.log(mockOrderModel.create.args)
    const mockOrderCreateArgs = {
      userId: mockUser.id,
      totalPrice: '45.48',
      totalToPay: '41',
      paymentStatus: "pending",
      paymentGateway: orderPayload.paymentGateway,
      paymentMethod: '',
      couponId: mockCoupon.id,
      couponDiscount: mockCoupon.discountValue,
    }

    // Assertions
    assert.exists(finishOrder)
    assert.equal(finishOrder, mockOrder)
    assert.equal(finishOrder?.paymentMethod, 'pi_test123')

    sinon.assert.calledOnce(mockOrder.save)
    sinon.assert.calledOnce(mockOrderModel.create)
    // assert.equal(mockOrderModel.create.getCall(0), mockOrderCreateArgs)
    // sinon.assert.calledOnceWithExactly(mockOrderModel.create, mockOrderCreateArgs)
    sinon.assert.calledOnceWithExactly(mockCartService.getSelectedCartItems, orderPayload.cartItemsIds)
    sinon.assert.calledOnceWithExactly(mockPaymentManager.use, orderPayload.paymentGateway)

    sinon.assert.calledOnce(queryStub)
    sinon.assert.calledOnceWithExactly(whereStub, "code", mockCoupon.code)
    sinon.assert.calledOnceWithExactly(mockCoupon.apply, Decimal('45.48'))
    sinon.assert.calledOnce(mockCoupon.use)

    // sinon.assert.calledOnce(mockCouponModel.query.where)
    // sinon.assert.calledOnce(mockCouponModel.query)


    // assert.isTrue(mockCartService.getSelectedCartItems.calledWith([1, 2]))
    // assert.isTrue(mockPaymentManager.use.calledWith('stripe'))
    // assert.isTrue(dbTransactionStub.called)
  }),

  test('should set order status successfully', async ({ assert }) => {
    const orderId = 1
    const newStatus = 'completed'
    
    const mockOrder = {
      id: 1,
      paymentStatus: 'pending',
      save: sinon.stub().resolves()
    }

    mockOrderModel.validatePaymentStatus = sinon.stub()
    mockOrderModel.find.resolves(mockOrder as any)

    const result = await orderService.setOrderStatus(orderId, newStatus as any)

    assert.isTrue(mockOrderModel.validatePaymentStatus.calledWith(newStatus))
    assert.isTrue(mockOrderModel.find.calledWith(orderId))
    assert.equal(mockOrder.paymentStatus, newStatus)
    assert.isTrue(mockOrder.save.calledOnce)
    assert.equal(result, mockOrder)
  })



  /* test('should finish order successfully with coupon', async ({ assert }) => {
    const orderPayload = {
      cartItemsIds: [1, 2],
      paymentGateway: 'stripe',
      couponCode: 'DISCOUNT10'
    }

    // Setup mocks
    mockCartService.getSelectedCartItems.resolves(mockCartItems)
    mockPaymentManager.use.returns(mockGateway as any)
    mockCouponModel.query = sinon.stub().returns({
      where: sinon.stub().returns({
        first: sinon.stub().resolves(mockCoupon)
      })
    }) as any

    const mockOrder = {
      id: 1,
      totalPrice: '45.48',
      totalToPay: '40.93',
      paymentStatus: 'pending',
      couponId: 1,
      couponDiscount: '4.55',
      save: sinon.stub().resolves()
    }

    const mockPaymentIntent = { id: 'pi_test123' }
    mockGateway.createPayment.resolves(mockPaymentIntent as any)
    mockOrderModel.create.resolves(mockOrder as any)
    mockOrderItemModel.create.resolves({} as any)

    dbTransactionStub.callsArgWith(0, {}).resolves(mockOrder)

    await orderService.finishOrder(mockUser, orderPayload)

    // Assertions
    assert.isTrue(mockCartService.getSelectedCartItems.calledWith([1, 2]))
    assert.isTrue(mockPaymentManager.use.calledWith('stripe'))
    assert.isTrue(mockCoupon.apply.called)
    assert.isTrue(mockCoupon.use.called)
  })

  test('should set order status successfully', async ({ assert }) => {
    const orderId = 1
    const newStatus = 'completed'
    
    const mockOrder = {
      id: 1,
      paymentStatus: 'pending',
      save: sinon.stub().resolves()
    }

    mockOrderModel.validatePaymentStatus = sinon.stub()
    mockOrderModel.find.resolves(mockOrder as any)

    const result = await orderService.setOrderStatus(orderId, newStatus as any)

    assert.isTrue(mockOrderModel.validatePaymentStatus.calledWith(newStatus))
    assert.isTrue(mockOrderModel.find.calledWith(orderId))
    assert.equal(mockOrder.paymentStatus, newStatus)
    assert.isTrue(mockOrder.save.called)
    assert.equal(result, mockOrder)
  })

  test('should throw error when order not found in setOrderStatus', async ({ assert }) => {
    const orderId = 999
    const newStatus = 'completed'

    mockOrderModel.validatePaymentStatus = sinon.stub()
    mockOrderModel.find.resolves(null)

    await assert.rejects(
      () => orderService.setOrderStatus(orderId, newStatus as any),
      'Order not found'
    )

    assert.isTrue(mockOrderModel.find.calledWith(orderId))
  })

  test('should calculate items total price correctly', async ({ assert }) => {
    // Access private method through reflection for testing
    const calculateMethod = (orderService as any).calculateItemsTotalPrice.bind(orderService)
    
    const result = calculateMethod(mockCartItems)
    
    assert.instanceOf(result, Decimal)
    assert.equal(result.toString(), '45.48')
  })

  test('should throw error when total price is zero or negative', async ({ assert }) => {
    const zeroCartItems = [
      {
        total: '0.00'
      }
    ]

    const calculateMethod = (orderService as any).calculateItemsTotalPrice.bind(orderService)
    
    assert.throws(
      () => calculateMethod(zeroCartItems),
      'Total price must be greater than zero'
    )
  })

  test('should create order item successfully', async ({ assert }) => {
    const mockOrder = { id: 1 } as Order
    const mockCartItem = mockCartItems[0]
    const mockTrx = {}

    mockOrderItemModel.create.resolves({} as any)

    const createOrderItemMethod = (orderService as any).createOrderItem.bind(orderService)
    
    await createOrderItemMethod(mockOrder, mockCartItem, mockTrx)

    const expectedOrderItemData = {
      orderId: 1,
      productId: 1,
      productDescription: 'Test Product 1',
      details: { size: 'M' },
      quantity: 2,
      total: '29.98'
    }

    assert.isTrue(mockOrderItemModel.create.calledWith(expectedOrderItemData, { client: mockTrx }))
  })

  test('should throw error when order item creation fails', async ({ assert }) => {
    const mockOrder = { id: 1 } as Order
    const mockCartItem = mockCartItems[0]
    const mockTrx = {}

    mockOrderItemModel.create.resolves(null)

    const createOrderItemMethod = (orderService as any).createOrderItem.bind(orderService)
    
    await assert.rejects(
      () => createOrderItemMethod(mockOrder, mockCartItem, mockTrx),
      'Error creating order item'
    )
  })

  test('should create order with transaction rollback on error', async ({ assert }) => {
    const orderPayload = {
      cartItemsIds: [1, 2],
      paymentGateway: 'stripe'
    }

    mockCartService.getSelectedCartItems.resolves(mockCartItems)
    mockPaymentManager.use.returns(mockGateway as any)
    mockCouponModel.query = sinon.stub().returns({
      where: sinon.stub().returns({
        first: sinon.stub().resolves(null)
      })
    }) as any

    // Simulate transaction error
    const transactionError = new Error('Transaction failed')
    dbTransactionStub.rejects(transactionError)

    await assert.rejects(
      () => orderService.finishOrder(mockUser, orderPayload),
      'Transaction failed'
    )
  })

  test('should handle payment gateway creation error', async ({ assert }) => {
    const orderPayload = {
      cartItemsIds: [1, 2],
      paymentGateway: 'stripe'
    }

    mockCartService.getSelectedCartItems.resolves(mockCartItems)
    mockPaymentManager.use.returns(mockGateway as any)
    mockCouponModel.query = sinon.stub().returns({
      where: sinon.stub().returns({
        first: sinon.stub().resolves(null)
      })
    }) as any

    const mockOrder = {
      id: 1,
      totalToPay: '45.48',
      save: sinon.stub().resolves()
    }

    mockOrderModel.create.resolves(mockOrder as any)
    mockOrderItemModel.create.resolves({} as any)
    
    // Simulate payment creation error
    const paymentError = new Error('Payment creation failed')
    mockGateway.createPayment.rejects(paymentError)

    dbTransactionStub.callsArgWith(0, {}).rejects(paymentError)

    await assert.rejects(
      () => orderService.finishOrder(mockUser, orderPayload),
      'Payment creation failed'
    )
  })

  test('should validate payment status before setting order status', async ({ assert }) => {
    const orderId = 1
    const invalidStatus = 'invalid_status'
    
    const validationError = new Error('Invalid payment status')
    mockOrderModel.validatePaymentStatus = sinon.stub().throws(validationError)

    await assert.rejects(
      () => orderService.setOrderStatus(orderId, invalidStatus as any),
      'Invalid payment status'
    )

    assert.isTrue(mockOrderModel.validatePaymentStatus.calledWith(invalidStatus))
    assert.isFalse(mockOrderModel.find.called)
  }) */
})