// app/controllers/categories_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'

export default class CategoriesController {
  async index({ response }: HttpContext) {
    const categories = await Category.all()
    return response.ok(categories)
  }

  async show({ params, response }: HttpContext) {
    const category = await Category.findOrFail(params.id)
    await category.load('products')
    return response.ok(category)
  }
}
