// app/controllers/products_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'

export default class ProductsController {
  async index({ response, auth }: HttpContext) {

    console.log(auth.user)
    // const products = await Product.all()
    const products = await Product.query().preload('categories', (query)=> { query.select('id', 'name') })
    .preload('variations', (query)=> { query.select('id', 'name', "price") })
    .preload('extras', (query)=> { query.select('id', 'name', "price") })
    
    return response.ok(products)
  }

  async show({ params, response }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    await product.load('categories')
    return response.ok(product)
  }
}
