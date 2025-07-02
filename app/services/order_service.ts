import Order from "#models/user/order"
import OrderItem from "#models/user/order_item"
import CartService from "./cart_service.js"
import Coupon from "#models/user/coupon"
import CartItem from "#models/user/cart_item"
import User from "#models/user/user"


import db from '@adonisjs/lucid/services/db'
import {Decimal} from 'decimal.js'

import type { OrderItemPayload } from "#types/requests/order"
import type { OrderStatusType } from "#types/order_status"
import paymentManager from "#modules/payment/payment_manager"

import GatewayAbstract from "#modules/payment/services/gateways/gateway_abstract"
import { GatewayManager } from "#modules/payment/services/gateway_manager"

export default class OrderService {

    constructor(
        private CouponModel: typeof Coupon,
        private cartServiceInstance: CartService,
        private paymentManagerInstance: GatewayManager,
        private OrderModel: typeof Order,
        private OrderItemModel: typeof OrderItem
    ) {
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

    // 
    private async createOrderItem(order: Order, cartItem: CartItem, trx: any) {
        
        const orderItemData = {
            orderId: order.id,
            productId: cartItem.productId,
            productDescription: cartItem.product.productDescription(),
            details: cartItem.details,
            quantity: cartItem.quantity,
            total: cartItem.total
        }

        // const orderItem = await order.related('items').create(orderItemData,  {client: trx})
        const orderItem = await this.OrderItemModel.create(orderItemData,  {client: trx})
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

    // composition
    public async finishOrder(user: User, body: OrderItemPayload){
        // get cart items
        const cartItemsIds = body.cartItemsIds 
        const cartItems = await this.cartServiceInstance.getSelectedCartItems(cartItemsIds)

        // get payment
        const gateway = this.paymentManagerInstance.use(body.paymentGateway)

        // coupon
        const coupon = body.couponCode? await this.CouponModel.query().where('code', body.couponCode).first() : null

        // create order with payment and cart items
        const createOrder = this.createOrder(user, cartItems, gateway, body.paymentGateway, coupon)

        // delete cart items


    }

    //
    private async createOrder(user: User, cartItems: CartItem[], gateway: GatewayAbstract, gatewayName: string, coupon: Coupon|null) {
        // const gatewayName = body.paymentGateway
        // should validate carts
        // const cartItems = await this.CartServiceInstance.getUserCartItems(user)

        const totalPrice = this.calculateItemsTotalPrice(cartItems)

        let orderValues: Partial<Order> =  {
            userId: user.id,
            totalPrice: totalPrice.toString(),
            totalToPay: totalPrice.toString(),
            paymentStatus: "pending",
            paymentGateway: gatewayName,
            paymentMethod: '', // change after create the payment

        }

        if (coupon) {
            const discountValue = coupon.apply(totalPrice)
            // console.log('Discount value:', discountValue.toString())

            orderValues.couponId = coupon.id
            orderValues.couponDiscount = discountValue.toString()
            orderValues.totalToPay = totalPrice.sub(discountValue).toString()
        }

        /* if (body.couponCode) {
            coupon = await this.CouponModel.query().where('code', body.couponCode).first()

            if (!coupon) {
                throw new Error('Coupon not found')
            }

            const discountValue = coupon.apply(totalPrice)
            console.log('Discount value:', discountValue.toString())

            orderValues.couponId = coupon.id
            orderValues.couponDiscount = discountValue.toString()
            orderValues.totalToPay = totalPrice.sub(discountValue).toString()
        } */

        // create transaction
        const order = await db.transaction(async (trx) => {
            const order = await this.OrderModel.create(orderValues, { client: trx })

            for (const cartItem of cartItems) {
                await this.createOrderItem(order, cartItem, trx) 
            }

            if (coupon) {
                await coupon.use(trx)
            }

            // create payment and edit order
            // const gateway = this.PaymentManagerInstance.use(gatewayName)
            const paymentIntent = await gateway.createPayment(order.id, order.totalToPay, "BRL")
            order.paymentMethod = paymentIntent.id
            await order.save()

            return order
        })

        return order
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
    }




}