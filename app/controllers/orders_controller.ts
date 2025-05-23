import type { HttpContext } from '@adonisjs/core/http'

import OrderService from '#services/order_service'
import CartService from '#services/cart_service'


export default class OrdersController {
  async store({ auth, response }: HttpContext) {

    try {
      const user = auth.user!
      const cartItems = await CartService.getOrderItemsOutput(user)
      const order = await OrderService.createOrder(user, cartItems, null)
  
      if (order) {
        CartService.cleanCart(user)
      }
      
      return order

    } catch (error){

      return response.status(400).json({ message: 'Order creation failed' })
    }
   
  }
}
