import Order from "#models/order"
import OrderItem from "#models/order_item"

import db from '@adonisjs/lucid/services/db'

import type { OrderStatusType } from "../types/order_status.js"

export default class OrderService {

    static async createOrderItems(order: any, cartItems: any) {
        cartItems.forEach(async (cartItem: any) => {
            await order.related('items').create(cartItem)
        })
    }

    static async applyCoupon(price: number, coupon: any) {
        if (coupon.type === 'percentage') {
            return price - (price * coupon.value / 100)
        } else if (coupon.type === 'fixed') {
            return price - coupon.value
        } else {
            throw new Error('Invalid coupon type')
        }
    }


    static async calculateOrderTotalPrice(orderItems: any) {

        const totalPrice = orderItems.reduce((acc: any, orderItem: any) => {
            return acc + orderItem.price
        })

        return totalPrice
    }

    static async createOrder(user: any, cartItems: any, coupon: any) {
        
        const order = await db.transaction(async (trx) => {
            const order = await Order.create({
                userId: user.id,
                status: "pending",
            }, { client: trx })

            
            await this.createOrderItems(order, cartItems)
            
            const totalPrice = await this.calculateOrderTotalPrice(cartItems)

            /* if (coupon) {
                const discountedPrice = await this.applyCoupon(totalPrice, coupon)
                // totalPrice = discountedPrice

                // order.couponId = coupon.id

            } */
            
            order.totalPrice = totalPrice
            await order.save()

            
            
            return order
        })

        return order
    }

    static async setOrderStatus(orderId: number, status: OrderStatusType) {
        const order = await Order.findOrFail(orderId)
        order.status = status
        await order.save()
    }




}