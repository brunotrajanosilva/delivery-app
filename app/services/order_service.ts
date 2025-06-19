import Order from "#models/user/order"
import CartService from "./cart_service.js"
import Coupon from "#models/user/coupon"
import CartItem from "#models/user/cart_item"

import paymentManager from "#modules/payment/payment_manager"

import db from '@adonisjs/lucid/services/db'
import {Decimal} from 'decimal.js'

import type { OrderItemPayload } from "../types/requests/order.js"
import type { OrderStatusType } from "../types/order_status.js"

export default class OrderService {

    constructor(
        private CouponModel: typeof Coupon,
        private CartServiceInstance: CartService,
        private PaymentManagerInstance: typeof paymentManager) {
    } 

    /* private async getCartItems(userId: number) {
        // should be validated in cart service
        const cartService = new CartService()
        const cartItems = await cartService.getUserCartItems(userId)

        return cartItems
    } */

    /* private async getCoupon(couponCode: string) {
        const couponInstance = new Coupon()
        const coupon = await couponInstance.findByCode(couponCode)

        if (!coupon) {
            throw new Error('Coupon not found')
        }
        return coupon
    } */


    private async createOrderItem(order: any, cartItem: CartItem, trx: any) {
        
        const orderItemData = {
            orderId: order.id,
            productId: cartItem.productId,
            productDescription: cartItem.product.productDescription(),
            details: cartItem.details,
            quantity: cartItem.quantity,
            total: cartItem.total
        }

        const orderItem = await order.related('items').create(orderItemData,  {client: trx})
        if (!orderItem) {
            throw new Error('Error creating order item')
        }

    }

    private calculateItemsTotalPrice(cartItems: any): Decimal {

       let totalPrice = new Decimal("0.00")

       for (const cartItem of cartItems) {
            totalPrice = totalPrice.plus(new Decimal(cartItem.total))
        }

        if (totalPrice.lessThanOrEqualTo("0")) {
            throw new Error('Total price must be greater than zero')
        }

        // console.log('Total cart items price:', totalPrice)

        return totalPrice
    }


    public async createOrder(user: any, body: OrderItemPayload) {
        const gatewayName = body.paymentGateway
        // should validate carts
        const cartItems = await this.CartServiceInstance.getUserCartItems(user)
        const totalPrice = this.calculateItemsTotalPrice(cartItems)

        let orderValues: Partial<Order> =  {
            userId: user.id,
            totalPrice: totalPrice.toString(),
            totalToPay: totalPrice.toString(),
            paymentStatus: "pending",
            paymentGateway: gatewayName,
            paymentMethod: '', // change after create the payment

        }

        let coupon = null

        if (body.couponCode) {
            coupon = await this.CouponModel.query().where('code', body.couponCode).first()

            if (!coupon) {
                throw new Error('Coupon not found')
            }

            const discountValue = coupon.apply(totalPrice)
            console.log('Discount value:', discountValue.toString())

            orderValues.couponId = coupon.id
            orderValues.couponDiscount = discountValue.toString()
            orderValues.totalToPay = totalPrice.sub(discountValue).toString()
        }

        // create transaction
        const order = await db.transaction(async (trx) => {
            const order = await Order.create(orderValues, { client: trx })

            for (const cartItem of cartItems) {
                await this.createOrderItem(order, cartItem, trx) 
            }

            if (coupon) {
                await coupon.use(trx)
            }

            // create payment and edit order
            const gateway = this.PaymentManagerInstance.use(gatewayName)
            const paymentIntent = await gateway.createPayment(order.id, order.totalToPay, "BRL")
            order.paymentMethod = paymentIntent.id
            await order.save()

            return order
        })

        return order
    }

    public async setOrderStatus(orderId: number, status: OrderStatusType) {
        Order.validatePaymentStatus(status)

        const order = await Order.find(orderId)

        if (!order) {
            throw new Error('Order not found')
        }

        order.paymentStatus = status
        await order.save()
        return order
    }




}