import { BaseSeeder } from "@adonisjs/lucid/seeders";
import Product from "#models/product/product";
import Category from "#models/product/category";

export default class ProductSeeder extends BaseSeeder {
  public async run() {
    const burgersCategory = await Category.findByOrFail("name", "Burgers");
    const pizzasCategory = await Category.findByOrFail("name", "Pizzas");
    const saladsCategory = await Category.findByOrFail("name", "Salads");

    const cheeseburger = await Product.create({
      name: "Cheeseburger",
      price: "5.99",
      description: "A classic cheeseburger",
    });
    await cheeseburger.related("categories").attach([burgersCategory.id]);

    const pepperoniPizza = await Product.create({
      name: "Pepperoni Pizza",
      price: "9.99",
      description: "A delicious pepperoni pizza",
    });
    await pepperoniPizza.related("categories").attach([pizzasCategory.id]);

    const chickenSandwich = await Product.create({
      name: "Chicken Sandwich",
      price: "6.99",
      description: "A tasty chicken sandwich",
    });
    await chickenSandwich.related("categories").attach([burgersCategory.id]);

    const greekSalad = await Product.create({
      name: "Greek Salad",
      price: "7.99",
      description: "A fresh Greek salad",
    });
    await greekSalad.related("categories").attach([saladsCategory.id]);
  }
}
