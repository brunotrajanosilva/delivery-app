// database/seeders/_ignore_04_stock_seeder.ts
import { BaseSeeder } from "@adonisjs/lucid/seeders";
import Ingredient from "#models/stock/ingredient";
import Recipe from "#models/stock/recipe";
import Stock from "#models/stock/stock";
import Extra from "#models/product/extra";

export default class StockSeeder extends BaseSeeder {
  public async run() {
    // Create ingredients
    const cheeseIngredient = await Ingredient.create({
      name: "Cheese",
      unit: "grams",
    });

    const pepperoniIngredient = await Ingredient.create({
      name: "Pepperoni",
      unit: "grams",
    });

    const lettuceIngredient = await Ingredient.create({
      name: "Lettuce",
      unit: "grams",
    });

    const tomatoIngredient = await Ingredient.create({
      name: "Tomato",
      unit: "grams",
    });

    const mozzarellaIngredient = await Ingredient.create({
      name: "Mozzarella",
      unit: "grams",
    });

    const baconIngredient = await Ingredient.create({
      name: "Bacon",
      unit: "grams",
    });

    //  Create Product Extras ==========================================
    await Extra.createMany([
      {
        name: "Extra Cheese",
        price: "1.99",
        quantity: 100,
        productId: 1,
        ingredientId: cheeseIngredient.id,
      },
      {
        name: "Extra Lettuce",
        price: "0.99",
        quantity: 100,
        productId: 2,
        ingredientId: lettuceIngredient.id,
      },
      {
        name: "Extra Cheese",
        price: "3.99",
        quantity: 200,
        productId: 2,
        ingredientId: cheeseIngredient.id,
      },
    ]);

    // Create recipes for variations ===================================
    const cheeseburgerSmallRecipe = await Recipe.createMany([
      {
        variationId: 1, // Assuming the cheeseburger variation ID is 1
        ingredientId: cheeseIngredient.id,
        quantity: 100,
      },
      {
        variationId: 1, // Assuming the cheeseburger variation ID is 1
        ingredientId: lettuceIngredient.id,
        quantity: 100,
      },
      {
        variationId: 1, // Assuming the cheeseburger variation ID is 1
        ingredientId: tomatoIngredient.id,
        quantity: 100,
      },
      {
        variationId: 1, // Assuming the cheeseburger variation ID is 1
        ingredientId: mozzarellaIngredient.id,
        quantity: 100,
      },
      {
        variationId: 1, // Assuming the cheeseburger variation ID is 1
        ingredientId: baconIngredient.id,
        quantity: 50,
      },
    ]);

    const pepperoniPizzaMediumRecipe = await Recipe.createMany([
      {
        variationId: 3, // Assuming the pepperoni pizza variation ID is 2
        ingredientId: pepperoniIngredient.id,
        quantity: 100,
      },
    ]);

    const cheeseburgerLargeRecipe = await Recipe.createMany([
      {
        variationId: 2, // Assuming the cheeseburger variation ID is 2
        ingredientId: cheeseIngredient.id,
        quantity: 300,
      },
      {
        variationId: 2, // Assuming the cheeseburger variation ID is 2
        ingredientId: lettuceIngredient.id,
        quantity: 300,
      },
      {
        variationId: 2, // Assuming the cheeseburger variation ID is 2
        ingredientId: tomatoIngredient.id,
        quantity: 300,
      },
      {
        variationId: 2, // Assuming the cheeseburger variation ID is 2
        ingredientId: mozzarellaIngredient.id,
        quantity: 300,
      },
      {
        variationId: 2, // Assuming the cheeseburger variation ID is 2
        ingredientId: baconIngredient.id,
        quantity: 150,
      },
    ]);

    // Create stocks for ingredients ====================================
    await Stock.createMany([
      {
        itemId: cheeseIngredient.id,
        itemType: "ingredient",
        available: 1000,
        reserved: 0,
        lowStock: 100,
      },
      {
        itemId: pepperoniIngredient.id,
        itemType: "ingredient",
        available: 1000,
        reserved: 0,
        lowStock: 100,
      },
      {
        itemId: lettuceIngredient.id,
        itemType: "ingredient",
        available: 1000,
        reserved: 0,
        lowStock: 100,
      },
      {
        itemId: tomatoIngredient.id,
        itemType: "ingredient",
        available: 1000,
        reserved: 0,
        lowStock: 100,
      },
      {
        itemId: mozzarellaIngredient.id,
        itemType: "ingredient",
        available: 1000,
        reserved: 0,
        lowStock: 100,
      },
      {
        itemId: baconIngredient.id,
        itemType: "ingredient",
        available: 1000,
        reserved: 0,
        lowStock: 100,
      },
    ]);
  }
}
