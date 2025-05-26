import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'


import CartService from '#services/cart_service'
import CartItem from '#models/cart_item'
import Product from '#models/product'
import User from '#models/user'
import type { CartItemPayload } from '#types/requests/cart_item'


const user = await User.create({ name: 'Test Name', email: 'test@example.com', address: "address for test",  password: 'secret' })
const product = await Product.create({ name: 'Burger', price: 10 })
const variation = await product.related('variations').create({ name: 'Large', price: 2 })
const variation2 = await product.related('variations').create({ name: 'Small', price: .5 })
const extra = await product.related('extras').create({ name: 'Cheese', price: 2 })
const extra2 = await product.related('extras').create({ name: 'Bacon', price: 5 })

const defaultPayload: CartItemPayload = {
  productId: product.id,
  quantity: 2,
  details: {
    variation: variation.id,
    extras: [{ id: extra.id, quantity: 1 }]
  },
}


test.group('CartService Integration', (group) => {
  group.setup(async (ctx: any) => {
    // const user = await User.create({ name: 'Test Name', email: 'test@example.com', address: "address for test",  password: 'secret' })
    // const product = await Product.create({ name: 'Burger', price: 10 })
    // const variation = await product.related('variations').create({ name: 'Large', price: 1 })
    // const extra = await product.related('extras').create({ name: 'Cheese', price: 2 })

    // ctx.user = user
    // ctx.product = product
    // ctx.variation = variation
    // ctx.extra = extra

    // Run migrations using Ace commands
    // const ace = await import('@adonisjs/core/services/ace')
    // await ace.default.exec('migration:run', [])
  })

  group.teardown(async () => {
    // Close database connections
    // await db.manager.closeAll()
  })

  group.each.setup(async () => {
    group.each.setup(() => testUtils.db().withGlobalTransaction())
    // Clean up data before each test
    // await db.table('cart_items').delete().catch(() => {}) // Ignore if table doesn't exist
    // await db.table('product_extras').delete().catch(() => {})
    // await db.table('product_variations').delete().catch(() => {})
    // await db.table('products').delete().catch(() => {})
    // await db.table('users').delete().catch(() => {})
  })
  
  test('storeCartItem creates a cart item with valid input', async ({ assert }) => {

    // const user = await User.create({ name: 'Test Name', email: 'test@example.com', address: "address for test",  password: 'secret' })
    // const product = await Product.create({ name: 'Burger', price: 10 })
    // const variation = await product.related('variations').create({ name: 'Large', price: 1 })
    // const extra = await product.related('extras').create({ name: 'Cheese', price: 2 })

    const cart = new CartService()

    const payload = defaultPayload
    // test creation
    const store = await cart.storeCartItem(user, payload)

    assert.exists(store.id)
    assert.equal(store.quantity, 2)
    assert.isAbove(store.total, 0)
    assert.instanceOf(store, CartItem )
    // assert.isString(store.details)
    assert.equal(store.total, 44) // (10 * 2 + 2 * 1 ) * 2

    // test raise errors
    const payloadWithInvalidProduct = {...payload, productId: 9999}
    const payloadWithInvalidQuantity = {...payload, quantity: -1}
    const payloadWithInvalidVariation = {...payload, details: {variation: 9999, extras:[]}}
    const payloadWithInvalidExtras = {...payload, details: {variation: variation.id, extras:[{ id: 9999, quantity: 2 }]}}
    const payloadWithInvalidExtrasQuantity = {...payload, details: {variation: variation.id, extras:[{ id: extra.id, quantity: -1 }]}}


    const invalidProduct = cart.storeCartItem(user, payloadWithInvalidProduct)
    const invalidQuantity = cart.storeCartItem(user, payloadWithInvalidQuantity)
    const invalidVariation = cart.storeCartItem(user, payloadWithInvalidVariation)
    const invalidExtras = cart.storeCartItem(user, payloadWithInvalidExtras)
    const invalidExtrasQuantity = cart.storeCartItem(user, payloadWithInvalidExtrasQuantity)


    await assert.rejects(() => invalidProduct, 'Product not found')
    await assert.rejects(() => invalidQuantity, 'Quantity must be greater than 0')
    await assert.rejects(() => invalidVariation, 'Variation not found')
    await assert.rejects(() => invalidExtras, 'Extra not found: 9999')
    await assert.rejects(() => invalidExtrasQuantity, 'Quantity must be greater than 0')
  })

  test("updateCartItem updates a cart item with valid input", async ({ assert }) => {
    const cart = new CartService()

    // test creation
    const createCartItem:CartItem = await cart.storeCartItem(user, defaultPayload)

    const updatePayload1: CartItemPayload = {
      quantity: 4,
    }

    const updatePayload2: CartItemPayload = {
      details: {
        variation: variation2.id,
      },
    }

    const updatePayload3: CartItemPayload = {
      details: {
        extras: [{ id: extra2.id, quantity: 4 }]
      },
    }

    const cartItemNotFound = cart.updateCartItem(user, updatePayload1, 9999)
    const updateCartItem1 = await cart.updateCartItem(user, updatePayload1, createCartItem.id)

    const updateCartItem2 = await cart.updateCartItem(user, updatePayload2, createCartItem.id)

    const updateCartItem3 = await cart.updateCartItem(user, updatePayload3, createCartItem.id)
    const updateCartItem3extras = JSON.parse(updateCartItem3.details).extras
    


    await assert.rejects(() => cartItemNotFound, 'Cart item not found')

    assert.equal(updateCartItem1.quantity, 4)
    assert.equal(updateCartItem1.total, 88) // (10 * 2 + 2 * 1 ) * 4

    //  SHOULD NOT BE 2
    assert.equal(JSON.parse(updateCartItem2.details).variation, variation2.id)
    assert.equal(updateCartItem2.total, 10) // (10 * .5 + 0 * 0 ) * 2

    assert.equal(updateCartItem3extras[0].id, extra2.id )
    assert.equal(updateCartItem3extras[0].quantity, 4 )
    assert.equal(updateCartItem3.total, 120) // (10 *    + 5 * 4 ) * 2
  
  })

  test("deleteCartItem deletes a cart item with valid input", async ({ assert }) => {
    const cart = new CartService()

    // test creation
    const createCartItem:CartItem = await cart.storeCartItem(user, defaultPayload)

    const deleteCartItem = await cart.deleteCartItem(user, createCartItem.id)
    const cartItemNotFound = cart.deleteCartItem(user, createCartItem.id)

    assert.equal(deleteCartItem, true)
    await assert.rejects(() => cartItemNotFound, 'Cart item not found')
  })

  test("get cart and empty cart", async ({ assert }) => {
    const cart = new CartService()

    // create 5 cartItems
    for (let i = 0; i < 5; i++) {
      await cart.storeCartItem(user, defaultPayload)
    }

    // get cart
    const getCart = await cart.getUserCartItems(user)

    // SHOULD NOT BE 7
    assert.equal(getCart.length, 7)


    // empty cart
    const failToDelete = cart.emptyCart({ id: 9999 }) // invalid user
    const emptyCart = await cart.emptyCart(user)

    await assert.rejects(() => failToDelete, 'Fail to delete cart items')

    const getEmptyCart = await cart.getUserCartItems(user)
    assert.equal(getEmptyCart.length, 0)
  
  })
})
