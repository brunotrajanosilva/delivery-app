import { BaseSeeder } from "@adonisjs/lucid/seeders";
import Variation from "#models/product/variation";
import Product from "#models/product/product";

export default class VariationSeeder extends BaseSeeder {
  public async run() {
    const cheeseburgerProduct = await Product.findByOrFail(
      "name",
      "Cheeseburger",
    );
    const pepperoniPizzaProduct = await Product.findByOrFail(
      "name",
      "Pepperoni Pizza",
    );

    await Variation.createMany([
      {
        name: "Small",
        price: "0.7",
        productId: cheeseburgerProduct.id,
        isRecipe: false,
      },
      {
        name: "Large",
        price: "1.9",
        productId: cheeseburgerProduct.id,
        isRecipe: false,
      },
      {
        name: "Medium",
        price: "1",
        productId: pepperoniPizzaProduct.id,
        isRecipe: true,
      },
    ]);
  }
}
