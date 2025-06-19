import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'

import DeliveryOrderService from '#modules/delivery/services/delivery_order_service'
import Order from '#models/user/order'
import User from "#models/user/user"


// const address3 = '500 Terry A Francois Blvd, San Francisco, CA'         
const address1 = '1600 Amphitheatre Parkway, Mountain View, CA'        
const address2 = '1 Infinite Loop, Cupertino, CA'                 
const address3 = '1355 Market St #900, San Francisco, CA'              
const address4 = '1 Hacker Way, Menlo Park, CA'


/* const order = Order.create({
    id: mockOrder.id,
    userId: 1,
    status: 'pending',
    total: 100,
    address: mockOrder.user.address
}) */

const user = await User.create({
    name: 'Jane Doe',
    address: address1,
    email: 'jane.doe@example.com',
    password: 'securePassword123',
})

const order = await Order.create({
    userId: user.id,
    totalPrice: '100.00',
    totalToPay: '90.00',
    paymentStatus: 'pending',
    paymentGateway: 'stripe',
    paymentMethod: 'card',
    expirationDate: DateTime.now().plus({ days: 7 }),
})

test.group('DeliveryOrderService', (group) => {
    group.each.setup(async () => {
      group.each.setup(() => testUtils.db().withGlobalTransaction())
    })

    test('should create a delivery order with geolocation', async ({ assert }) => {
        const deliveryOrderService = new DeliveryOrderService()

        const deliveryOrder = await deliveryOrderService.createDeliveryOrder(order.id, address1)

        assert.exists(deliveryOrder)
        assert.equal(deliveryOrder.orderId, order.id)
    })
})