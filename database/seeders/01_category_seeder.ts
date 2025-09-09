import { BaseSeeder } from "@adonisjs/lucid/seeders";
import Category from "#models/product/category";

export default class CategorySeeder extends BaseSeeder {
  public async run() {
    await Category.createMany([
      { name: "Burgers", description: "Juicy burgers" },
      { name: "Pizzas", description: "Delicious pizzas" },
      { name: "Sandwiches", description: "Tasty sandwiches" },
      { name: "Salads", description: "Fresh salads" },
      { name: "Desserts", description: "Sweet treats" },
    ]);
  }
}
