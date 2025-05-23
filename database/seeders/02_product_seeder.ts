import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Product from '#models/product'
import Category from '#models/category'

export default class ProductSeeder extends BaseSeeder {
  async run() {
    const burgers = await Category.findByOrFail('name', 'Burgers')
    const drinks = await Category.findByOrFail('name', 'Drinks')
    const pizzas = await Category.findByOrFail('name', 'Pizzas')
    const snacks = await Category.findByOrFail('name', 'Snacks')

    const cheeseburger = await Product.create({ name: 'Cheeseburger', price: 5.99 })
    const cola = await Product.create({ name: 'Coca-Cola', price: 1.99 })
    const pepperoniPizza = await Product.create({ name: 'Pepperoni Pizza', price: 9.99 })
    const pepsi = await Product.create({ name: 'Pepsi', price: 1.89 })
    const chips = await Product.create({ name: 'Chips', price: 2.49 })
    const fries = await Product.create({ name: 'French Fries', price: 2.99 })
    const nachos = await Product.create({ name: 'Nachos', price: 3.49 })
    const sprite = await Product.create({ name: 'Sprite', price: 1.89 })

    await cheeseburger.related('categories').attach([burgers.id])
    await cola.related('categories').attach([drinks.id])
    await pepperoniPizza.related('categories').attach([pizzas.id])
    await pepsi.related('categories').attach([drinks.id])
    await chips.related('categories').attach([snacks.id]) 
    await fries.related('categories').attach([snacks.id])
    await nachos.related('categories').attach([snacks.id])
    await sprite.related('categories').attach([drinks.id])


  }
}
