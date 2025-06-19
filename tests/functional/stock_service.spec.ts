import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { assert } from '@japa/assert'


import StockService from '#services/stock_service'
import Stock from '#models/stock/stock'
import Recipe from '#models/stock/recipe'
import Extra from '#models/product/extra'
import Ingredient from '#models/stock/ingredient'
import Product from '#models/product/product'
import Variation from '#models/product/variation'

// Mock data helpers
function fakeCartItem(variation: Variation, extras: any[], quantity = 1) {
  return {
    quantity,
    getParsedDetails() {
      return {
        variation: variation,
        extras,
      }
    }
  }
}

const product = await Product.create({ name: 'Pizza', price: "20.00"})
const variation = await Variation.create({ name: 'Large Pizza', price: "1.5", productId: product.id, isRecipe: true })
const ingredient = await Ingredient.create({ name: 'Cheese', unit: "grams" })

test.group('StockService', (group) => {
  group.each.teardown(async () => {
    await Stock.truncate()
    await Recipe.truncate()
    await Extra.truncate()
    await Ingredient.truncate()
  })

  group.each.setup(async () => {
    group.each.setup(() => testUtils.db().withGlobalTransaction())
  })

  test('should return true if all ingredients are in stock', async ({ assert }) => {

    await Recipe.create({
      variationId: variation.id,
      ingredientId: ingredient.id,
      quantity: 100
    })

    await Stock.create({
        itemId: ingredient.id,
        itemType: 'ingredient',
        quantity: 1000,
        lowStock: 100,
    })

    const cartItems = [fakeCartItem(variation, [], 4)] // Needs 400 cheese

    const service = new StockService()
    const result = await service.cartItemsisInStock(cartItems)

    assert.isTrue(result)
  })

  test('should return true if variationIngredient is in stock', async ({ assert }) => {
    // const ingredient2 = await Ingredient.create({ name: 'Meat', unit: "grams" })
    const variationIngredient = await Variation.create({name: 'Large Hamburguer', price: "1.5",
      productId: product.id, isRecipe: false})


    // Only 200 in stock, but 400 needed
    await Stock.create({
      itemId: variationIngredient.id,
      itemType: 'variation',
      quantity: 100,
      lowStock: 10
    })

    const cartItems = [fakeCartItem(variationIngredient, [], 4)]

    const service = new StockService()
    const result = await service.cartItemsisInStock(cartItems)

    assert.isTrue(result)
  })

  test('should return false if ingredient is missing in stock', async ({ assert }) => {
    const ingredient2 = await Ingredient.create({ name: 'Meat', unit: "grams" })

    await Recipe.create({
      variationId: variation.id,
      ingredientId: ingredient2.id,
      quantity: 100
    })


    const cartItems = [fakeCartItem(variation, [], 4)]

    const service = new StockService()
    const result = service.cartItemsisInStock(cartItems)

    await assert.rejects(()=> result, `No stock found for ingredient ID ${ingredient2.id}`)
  })


  test('should return false if ingredient quantity in stock is less than needed', async ({ assert }) => {
    const ingredient2 = await Ingredient.create({ name: 'Meat', unit: "grams" })

    await Recipe.create({
      variationId: variation.id,
      ingredientId: ingredient2.id,
      quantity: 100
    })

    // Only 200 in stock, but 400 needed
    const stock = await Stock.create({
      itemId: ingredient2.id,
      itemType: 'ingredient',
      quantity: 200,
      lowStock: 300
    })

    const cartItems = [fakeCartItem(variation, [], 4)]

    const service = new StockService()
    const result = service.cartItemsisInStock(cartItems)

    await assert.rejects(()=> result, 
    `Insufficient stock for ingredient ID ${ingredient2.id}. Required: ${400}, Available: ${stock.quantity}`)
  })

  // discount
  test('should discount the ingredients', async ({ assert }) => {
    const cheese = await Ingredient.create({ name: 'Cheese', unit: "grams" })

    const extra = await Extra.create({
      productId: product.id,
      ingredientId: cheese.id,
      name: 'Extra Cheese',
      quantity: 70,
      price: "54"
    })

    await Recipe.create({
      variationId: variation.id,
      ingredientId: cheese.id,
      quantity: 150
    })

    const stock = await Stock.create({
      itemId: cheese.id,
      itemType: 'ingredient',
      quantity: 1000
    })

    const cartItems = [fakeCartItem(variation, [{ id: extra.id, quantity: 2 }], 3)] // v: 150 x 3 + e: 70 x 2 x 3 = 870

    const service = new StockService()
    const result = await service.orderItemsDiscountStock(cartItems)

    const getCheeseStock = await Stock.query().where('itemId', cheese.id).where('itemType', 'ingredient').first()
    assert.equal(getCheeseStock?.quantity, stock.quantity - 870)

  })


})
