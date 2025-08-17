import type { HttpContext } from '@adonisjs/core/http'
import CartService from '#services/cart_service'
import CartItem from '#models/user/cart_item'

import type { CartItemPayload } from '#types/requests/cart_item'

import ResponseHelper from '#helpers/responses/responses_helper'
// import CartService from '#services/cart_service'
const cartService = new CartService(CartItem)

export default class CartController {
  /**
   * Display cart contents
   */
    async index({ auth, request, response }: HttpContext) {
        try {
            const user = auth.user
            const page = request.input("page")

            const userCartItems = await cartService.getUserCartItems(user.id)
            const userCart = userCartItems.paginate(page, 10)
            const userCartResponse = ResponseHelper.format(userCart)

        
            return response.ok(
                {
                    success: true,
                    ...userCartResponse
                }
            )
        } catch (error) {
            return response.internalServerError({
                success: false,
                message: 'Failed to retrieve cart',
                error: error.message
            })
        }
    }

    /**
     * Add item to cart
     */
    async store({ auth, request, response }: HttpContext) {
        try {
            const user = auth.user
            const body = request.body()
            // VALIDATE BODY

            
            // should be changed for user.id
            const store = await cartService.storeCartItem(user, body as any)
        
        return response.created({
            success: true,
            message: 'Item added to cart successfully',
            data: store.serialize()
        })
        } catch (error) {
        return response.internalServerError({
            success: false,
            message: 'Failed to add item to cart',
            error: error.message
        })
        }
    }

    /**
     * Update cart item
     */
    async update({ auth, params, request, response }: HttpContext) {
        try {
            const user = auth.user
            const cartId = params.id
            const body = request.body()
            // VALIDATE BODY

            
            // should be changed for user.id
            const updated = await cartService.updateCartItem(user.id, cartId, body as any)
            
            return response.ok({
                success: true,
                message: 'Cart updated successfully',
                data: updated.serialize()
            })
            } catch (error) {
            return response.internalServerError({
                success: false,
                message: 'Failed to update cart',
                error: error.message
            })
        }
    }
}