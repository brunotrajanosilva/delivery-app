import type { HttpContext } from '@adonisjs/core/http'
import CartItem from '#models/cart_item'
import Product from '#models/product'
import type { CartItemPayload } from '../types/requests/cart_item.js'
import db from '@adonisjs/lucid/services/db'

import CartService from '#services/cart_service'

export default class CartController {
  // GET ---------------------------
  async index({ auth }: HttpContext) {
    const user = auth.user!

    const cartItem = await CartService.getUserCartItems(user)

    console.log(cartItem)
    return cartItem
    /* .map((item) => ({
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
      },
      quantity: item.quantity,
      detail: item.detail ? JSON.parse(item.detail) : null,
    })) */
   
  }

  // POST --------------------
  async store({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const body = request.body() as CartItemPayload

    const store = await CartService.storeCartItem(user, body)

    return store



    // validate body fields
    /* if (!body.productId || !body.variationId || !body.quantity || !body.extras ) {
      return response.badRequest({ message: 'Missing required fields' })
    }

    const product = await Product.find(body.productId)
    if (!product) {
      return response.notFound({ message: 'Product not found' })
    }

    const variation = product.variations.find((variation) => variation.id === body.variationId)
    if (!variation) {
      return response.notFound({ message: 'Variation not found' })
    }

  
    body.extras.forEach((extra) => {
      const foundExtra = product.extras.find((productExtra) => productExtra.id === extra.extraId)
      if (!foundExtra) {
        return response.notFound({ message: 'Extra not found' })
      }
    })

    if (!variation) {
      return response.notFound({ message: 'Variation not found' })
    }
  
    await db.transaction(async (trx) => {

      // Create cart
      const cartItem = await CartItem.create({
        userId: user.id,
        productId: product.id,
        variationId: variation.id,
        quantity: body.quantity,
      }, { client: trx })


      // Remove related
      // await cartItem.related("extras").query().delete()
      // Create new related
      await cartItem.related("extras").useTransaction(trx).createMany(body.extras, { client: trx })

      return cartItem

    }) */
  }

  //  PUT --------------------
  /* async update({ auth, request, response, params }: HttpContext) {
    const user = auth.user!
    const cartItemId = params.id
  
    const body = request.body() as CartItemPayload

    // validate body fields
    if (!body.productId || !body.quantity || !body.extras) {
      return response.badRequest({ message: 'Missing required fields' })
    }
  
    const cartItem = await CartItem.query()
      .where('id', cartItemId)
      .where('userId', user.id)
      .first()


    if (!cartItem) {
      return response.notFound({ message: 'Cart item not found' })
    }

    const trx = await Database.transaction()

    try {
      // Create cart
      const cartItem = await CartItem.create({
        userId: user.id,
        productId: body.productId,
        variationId: body.variationId,
        quantity: body.quantity,
      }, { client: trx })


      // Remove related
      await cartItem.related("extras").query({ client: trx }).delete()
      // Create new related
      const cartItemExtras = await cartItem.related("extras").createMany(body.extras, { client: trx })

      await trx.commit()
      return cartItem

    } catch (error) {
      await trx.rollback()
      return response.internalServerError({ message: 'Could not add item in the cart', error })
    }



    if (body.quantity) {
      cartItem.quantity = body.quantity

    }

    if (body.variationId) {
      cartItem.variationId = body.variationId
    }

    if (body.extras) {
      body.extras.forEach(async (extra) => {
        const cartItemExtra = await cartItem.related('extras').query().where('extraId', extra.extraId).first()
        cartItemExtra?.quantity = extra.quantity
        await cartItemExtra?.save()
      })
      
    }
  

  } */
}
