import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Variation from '#models/variation'
import Product from '#models/product'

export default class VariationSeeder extends BaseSeeder {
  async run() {
    const burger = await Product.findByOrFail('name', 'Cheeseburger')
    const cola = await Product.findByOrFail('name', 'Coca-Cola')
    const pizza = await Product.findByOrFail('name', 'Pepperoni Pizza')

    await Variation.createMany([
      { name: 'Small', price: 1.0, productId: burger.id },
      { name: 'Medium', price: 1.2, productId: burger.id },
      { name: 'Large', price: 1.5, productId: burger.id },

      { name: 'Can', price: 1.0, productId: cola.id },
      { name: 'Bottle', price: 1.5, productId: cola.id },

      { name: 'Small', price: 1.0, productId: pizza.id },
      { name: 'Family', price: 2.0, productId: pizza.id },
    ])
  }
}
