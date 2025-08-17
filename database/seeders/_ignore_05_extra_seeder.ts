import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Extra from '#models/extra'
import Product from '#models/product'

export default class ExtraSeeder extends BaseSeeder {
  async run() {
    const burger = await Product.findByOrFail('name', 'Cheeseburger')
    const pizza = await Product.findByOrFail('name', 'Pepperoni Pizza')

    await Extra.createMany([
      { name: 'Extra Cheese', price: 1.99, productId: burger.id },
      { name: 'Bacon', price: 2.5, productId: burger.id },
      { name: 'Garlic Crust', price: 1.0, productId: pizza.id },
      { name: 'Double Pepperoni', price: 2.99, productId: pizza.id },
    ])
  }
}
