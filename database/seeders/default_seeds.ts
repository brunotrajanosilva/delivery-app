import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Category from '#models/product/category'
import Product from '#models/product/product'
import Variation from '#models/product/variation'
import Extra from '#models/product/extra'
import Ingredient from '#models/stock/ingredient'
import Recipe from '#models/stock/recipe'
import Stock from '#models/stock/stock'

export default class FoodDeliverySeeder extends BaseSeeder {
  async run() {
    // Create Categories
    const categories = await Category.createMany([
      { name: 'Pizza', description: 'Delicious pizzas' },
      { name: 'Burgers', description: 'Juicy burgers' },
      { name: 'Beverages', description: 'Refreshing drinks' },
      { name: 'Desserts', description: 'Sweet treats' },
      { name: 'Salads', description: 'Fresh and healthy' },
      { name: 'Pasta', description: 'Italian pasta dishes' },
    ])

    // Create Ingredients
    const ingredients = await Ingredient.createMany([
      // Pizza ingredients
      { name: 'Pizza Dough', unit: 'pieces' },
      { name: 'Tomato Sauce', unit: 'ml' },
      { name: 'Mozzarella Cheese', unit: 'g' },
      { name: 'Pepperoni', unit: 'slices' },
      { name: 'Mushrooms', unit: 'g' },
      { name: 'Bell Peppers', unit: 'g' },
      { name: 'Olives', unit: 'g' },
      { name: 'Basil', unit: 'g' },
      
      // Burger ingredients
      { name: 'Burger Bun', unit: 'pieces' },
      { name: 'Beef Patty', unit: 'pieces' },
      { name: 'Chicken Breast', unit: 'pieces' },
      { name: 'Lettuce', unit: 'leaves' },
      { name: 'Tomato Slices', unit: 'slices' },
      { name: 'Onion', unit: 'rings' },
      { name: 'Pickles', unit: 'slices' },
      { name: 'Cheddar Cheese', unit: 'slices' },
      { name: 'Bacon', unit: 'strips' },
      { name: 'Mayo', unit: 'g' },
      { name: 'Ketchup', unit: 'g' },
      
      // Pasta ingredients
      { name: 'Spaghetti', unit: 'g' },
      { name: 'Penne', unit: 'g' },
      { name: 'Alfredo Sauce', unit: 'ml' },
      { name: 'Marinara Sauce', unit: 'ml' },
      { name: 'Parmesan Cheese', unit: 'g' },
      { name: 'Grilled Chicken', unit: 'g' },
      
      // Beverages (no recipe needed)
      { name: 'Coca Cola', unit: 'ml' },
      { name: 'Orange Juice', unit: 'ml' },
      { name: 'Water', unit: 'ml' },
      
      // Salad ingredients
      { name: 'Mixed Greens', unit: 'g' },
      { name: 'Cherry Tomatoes', unit: 'pieces' },
      { name: 'Cucumber', unit: 'slices' },
      { name: 'Croutons', unit: 'g' },
      { name: 'Caesar Dressing', unit: 'ml' },
      { name: 'Ranch Dressing', unit: 'ml' },
      
      // Dessert ingredients
      { name: 'Chocolate Cake Base', unit: 'pieces' },
      { name: 'Vanilla Ice Cream', unit: 'scoops' },
      { name: 'Chocolate Sauce', unit: 'ml' },
      { name: 'Whipped Cream', unit: 'g' },
      { name: 'Strawberries', unit: 'pieces' },
    ])

    // Create Stock for all ingredients
    for (const ingredient of ingredients) {
      await Stock.create({
        itemId: ingredient.id,
        itemType: 'ingredient',
        quantity: Math.floor(Math.random() * 500) + 100, // Random quantity between 100-600
        lowStock: Math.floor(Math.random() * 50) + 10, // Random low stock between 10-60
      })
    }

    // Create Products
    const products = await Product.createMany([
      { 
        name: 'Margherita Pizza', 
        price: '24.99',
        description: 'Classic Italian pizza with fresh tomato sauce, mozzarella cheese, and aromatic basil leaves on a crispy thin crust'
      },
      { 
        name: 'Pepperoni Pizza', 
        price: '28.99',
        description: 'America\'s favorite pizza topped with spicy pepperoni slices, mozzarella cheese, and tangy tomato sauce'
      },
      { 
        name: 'Veggie Supreme Pizza', 
        price: '26.99',
        description: 'A garden-fresh delight loaded with mushrooms, bell peppers, black olives, and melted mozzarella cheese'
      },
      { 
        name: 'Classic Burger', 
        price: '18.99',
        description: 'Juicy beef patty with fresh lettuce, tomato, onion, pickles, and our signature sauce on a toasted bun'
      },
      { 
        name: 'Chicken Deluxe Burger', 
        price: '22.99',
        description: 'Premium grilled or crispy chicken breast with crispy bacon, cheddar cheese, lettuce, tomato, and creamy mayo'
      },
      { 
        name: 'Spaghetti Carbonara', 
        price: '19.99',
        description: 'Traditional Italian pasta with crispy bacon, creamy egg sauce, and freshly grated Parmesan cheese'
      },
      { 
        name: 'Penne Alfredo', 
        price: '21.99',
        description: 'Al dente penne pasta in rich and creamy Alfredo sauce, topped with grilled chicken and Parmesan cheese'
      },
      { 
        name: 'Caesar Salad', 
        price: '14.99',
        description: 'Fresh romaine lettuce with crunchy croutons, Parmesan cheese, and our house-made Caesar dressing'
      },
      { 
        name: 'Beverages', 
        price: '3.99',
        description: 'Refreshing selection of soft drinks, juices, and water to complement your meal perfectly'
      },
      { 
        name: 'Chocolate Cake', 
        price: '8.99',
        description: 'Decadent chocolate cake with rich chocolate sauce, whipped cream, and fresh strawberries'
      },
    ])

    // Associate products with categories
    await products[0].related('categories').attach([categories[0].id]) // Margherita Pizza
    await products[1].related('categories').attach([categories[0].id]) // Pepperoni Pizza
    await products[2].related('categories').attach([categories[0].id]) // Veggie Supreme Pizza
    await products[3].related('categories').attach([categories[1].id]) // Classic Burger
    await products[4].related('categories').attach([categories[1].id]) // Chicken Deluxe Burger
    await products[5].related('categories').attach([categories[5].id]) // Spaghetti Carbonara
    await products[6].related('categories').attach([categories[5].id]) // Penne Alfredo
    await products[7].related('categories').attach([categories[4].id]) // Caesar Salad
    await products[8].related('categories').attach([categories[2].id]) // Beverages
    await products[9].related('categories').attach([categories[3].id]) // Chocolate Cake

    // Create Variations for Products
    
    // Pizza Variations (sizes)
    const pizzaVariations = await Variation.createMany([
      // Margherita Pizza
      { name: 'Small (10")', price: '0.00', isRecipe: true, productId: products[0].id },
      { name: 'Medium (12")', price: '4.00', isRecipe: true, productId: products[0].id },
      { name: 'Large (14")', price: '8.00', isRecipe: true, productId: products[0].id },
      
      // Pepperoni Pizza
      { name: 'Small (10")', price: '0.00', isRecipe: true, productId: products[1].id },
      { name: 'Medium (12")', price: '4.00', isRecipe: true, productId: products[1].id },
      { name: 'Large (14")', price: '8.00', isRecipe: true, productId: products[1].id },
      
      // Veggie Supreme Pizza
      { name: 'Small (10")', price: '0.00', isRecipe: true, productId: products[2].id },
      { name: 'Medium (12")', price: '4.00', isRecipe: true, productId: products[2].id },
      { name: 'Large (14")', price: '8.00', isRecipe: true, productId: products[2].id },
      
      // Burger Variations
      { name: 'Single Patty', price: '0.00', isRecipe: true, productId: products[3].id },
      { name: 'Double Patty', price: '5.00', isRecipe: true, productId: products[3].id },
      
      { name: 'Grilled', price: '0.00', isRecipe: true, productId: products[4].id },
      { name: 'Crispy', price: '2.00', isRecipe: true, productId: products[4].id },
      
      // Pasta Variations
      { name: 'Regular Portion', price: '0.00', isRecipe: true, productId: products[5].id },
      { name: 'Large Portion', price: '4.00', isRecipe: true, productId: products[5].id },
      
      { name: 'Regular Portion', price: '0.00', isRecipe: true, productId: products[6].id },
      { name: 'Large Portion', price: '4.00', isRecipe: true, productId: products[6].id },
      
      // Salad Variations
      { name: 'Small', price: '0.00', isRecipe: true, productId: products[7].id },
      { name: 'Large', price: '3.00', isRecipe: true, productId: products[7].id },
      
      // Beverage Variations (no recipe)
      { name: 'Coca Cola 330ml', price: '0.00', isRecipe: false, productId: products[8].id },
      { name: 'Coca Cola 500ml', price: '1.00', isRecipe: false, productId: products[8].id },
      { name: 'Orange Juice 330ml', price: '0.50', isRecipe: false, productId: products[8].id },
      { name: 'Water 500ml', price: '-1.00', isRecipe: false, productId: products[8].id },
      
      // Dessert Variations
      { name: 'Single Slice', price: '0.00', isRecipe: true, productId: products[9].id },
      { name: 'Double Slice', price: '5.00', isRecipe: true, productId: products[9].id },
    ])

    // Create Stock for beverage variations (no recipe items)
    const beverageVariations = pizzaVariations.filter(v => !v.isRecipe)
    for (const variation of beverageVariations) {
      await Stock.create({
        itemId: variation.id,
        itemType: 'variation',
        quantity: Math.floor(Math.random() * 100) + 50,
        lowStock: 10,
      })
    }

    // Create Recipes for variations that have recipes
    const recipeVariations = pizzaVariations.filter(v => v.isRecipe)
    
    // Helper function to find ingredient by name
    const getIngredient = (name: string) => ingredients.find(i => i.name === name)!

    // Margherita Pizza Recipes
    await Recipe.createMany([
      // Small Margherita
      { variationId: recipeVariations[0].id, ingredientId: getIngredient('Pizza Dough').id, quantity: 1 },
      { variationId: recipeVariations[0].id, ingredientId: getIngredient('Tomato Sauce').id, quantity: 80 },
      { variationId: recipeVariations[0].id, ingredientId: getIngredient('Mozzarella Cheese').id, quantity: 100 },
      { variationId: recipeVariations[0].id, ingredientId: getIngredient('Basil').id, quantity: 5 },
      
      // Medium Margherita
      { variationId: recipeVariations[1].id, ingredientId: getIngredient('Pizza Dough').id, quantity: 1 },
      { variationId: recipeVariations[1].id, ingredientId: getIngredient('Tomato Sauce').id, quantity: 100 },
      { variationId: recipeVariations[1].id, ingredientId: getIngredient('Mozzarella Cheese').id, quantity: 150 },
      { variationId: recipeVariations[1].id, ingredientId: getIngredient('Basil').id, quantity: 8 },
      
      // Large Margherita
      { variationId: recipeVariations[2].id, ingredientId: getIngredient('Pizza Dough').id, quantity: 1 },
      { variationId: recipeVariations[2].id, ingredientId: getIngredient('Tomato Sauce').id, quantity: 120 },
      { variationId: recipeVariations[2].id, ingredientId: getIngredient('Mozzarella Cheese').id, quantity: 200 },
      { variationId: recipeVariations[2].id, ingredientId: getIngredient('Basil').id, quantity: 10 },
    ])

    // Pepperoni Pizza Recipes
    await Recipe.createMany([
      // Small Pepperoni
      { variationId: recipeVariations[3].id, ingredientId: getIngredient('Pizza Dough').id, quantity: 1 },
      { variationId: recipeVariations[3].id, ingredientId: getIngredient('Tomato Sauce').id, quantity: 80 },
      { variationId: recipeVariations[3].id, ingredientId: getIngredient('Mozzarella Cheese').id, quantity: 100 },
      { variationId: recipeVariations[3].id, ingredientId: getIngredient('Pepperoni').id, quantity: 15 },
      
      // Medium Pepperoni
      { variationId: recipeVariations[4].id, ingredientId: getIngredient('Pizza Dough').id, quantity: 1 },
      { variationId: recipeVariations[4].id, ingredientId: getIngredient('Tomato Sauce').id, quantity: 100 },
      { variationId: recipeVariations[4].id, ingredientId: getIngredient('Mozzarella Cheese').id, quantity: 150 },
      { variationId: recipeVariations[4].id, ingredientId: getIngredient('Pepperoni').id, quantity: 20 },
      
      // Large Pepperoni
      { variationId: recipeVariations[5].id, ingredientId: getIngredient('Pizza Dough').id, quantity: 1 },
      { variationId: recipeVariations[5].id, ingredientId: getIngredient('Tomato Sauce').id, quantity: 120 },
      { variationId: recipeVariations[5].id, ingredientId: getIngredient('Mozzarella Cheese').id, quantity: 200 },
      { variationId: recipeVariations[5].id, ingredientId: getIngredient('Pepperoni').id, quantity: 25 },
    ])

    // Veggie Supreme Pizza Recipes
    await Recipe.createMany([
      // Small Veggie Supreme
      { variationId: recipeVariations[6].id, ingredientId: getIngredient('Pizza Dough').id, quantity: 1 },
      { variationId: recipeVariations[6].id, ingredientId: getIngredient('Tomato Sauce').id, quantity: 80 },
      { variationId: recipeVariations[6].id, ingredientId: getIngredient('Mozzarella Cheese').id, quantity: 100 },
      { variationId: recipeVariations[6].id, ingredientId: getIngredient('Mushrooms').id, quantity: 30 },
      { variationId: recipeVariations[6].id, ingredientId: getIngredient('Bell Peppers').id, quantity: 25 },
      { variationId: recipeVariations[6].id, ingredientId: getIngredient('Olives').id, quantity: 20 },
      
      // Medium Veggie Supreme
      { variationId: recipeVariations[7].id, ingredientId: getIngredient('Pizza Dough').id, quantity: 1 },
      { variationId: recipeVariations[7].id, ingredientId: getIngredient('Tomato Sauce').id, quantity: 100 },
      { variationId: recipeVariations[7].id, ingredientId: getIngredient('Mozzarella Cheese').id, quantity: 150 },
      { variationId: recipeVariations[7].id, ingredientId: getIngredient('Mushrooms').id, quantity: 50 },
      { variationId: recipeVariations[7].id, ingredientId: getIngredient('Bell Peppers').id, quantity: 40 },
      { variationId: recipeVariations[7].id, ingredientId: getIngredient('Olives').id, quantity: 30 },
      
      // Large Veggie Supreme
      { variationId: recipeVariations[8].id, ingredientId: getIngredient('Pizza Dough').id, quantity: 1 },
      { variationId: recipeVariations[8].id, ingredientId: getIngredient('Tomato Sauce').id, quantity: 120 },
      { variationId: recipeVariations[8].id, ingredientId: getIngredient('Mozzarella Cheese').id, quantity: 200 },
      { variationId: recipeVariations[8].id, ingredientId: getIngredient('Mushrooms').id, quantity: 60 },
      { variationId: recipeVariations[8].id, ingredientId: getIngredient('Bell Peppers').id, quantity: 50 },
      { variationId: recipeVariations[8].id, ingredientId: getIngredient('Olives').id, quantity: 40 },
    ])

    // Classic Burger Recipes
    await Recipe.createMany([
      // Single Patty
      { variationId: recipeVariations[9].id, ingredientId: getIngredient('Burger Bun').id, quantity: 1 },
      { variationId: recipeVariations[9].id, ingredientId: getIngredient('Beef Patty').id, quantity: 1 },
      { variationId: recipeVariations[9].id, ingredientId: getIngredient('Lettuce').id, quantity: 2 },
      { variationId: recipeVariations[9].id, ingredientId: getIngredient('Tomato Slices').id, quantity: 2 },
      { variationId: recipeVariations[9].id, ingredientId: getIngredient('Onion').id, quantity: 3 },
      { variationId: recipeVariations[9].id, ingredientId: getIngredient('Pickles').id, quantity: 3 },
      { variationId: recipeVariations[9].id, ingredientId: getIngredient('Ketchup').id, quantity: 15 },
      
      // Double Patty
      { variationId: recipeVariations[10].id, ingredientId: getIngredient('Burger Bun').id, quantity: 1 },
      { variationId: recipeVariations[10].id, ingredientId: getIngredient('Beef Patty').id, quantity: 2 },
      { variationId: recipeVariations[10].id, ingredientId: getIngredient('Lettuce').id, quantity: 2 },
      { variationId: recipeVariations[10].id, ingredientId: getIngredient('Tomato Slices').id, quantity: 2 },
      { variationId: recipeVariations[10].id, ingredientId: getIngredient('Onion').id, quantity: 3 },
      { variationId: recipeVariations[10].id, ingredientId: getIngredient('Pickles').id, quantity: 3 },
      { variationId: recipeVariations[10].id, ingredientId: getIngredient('Cheddar Cheese').id, quantity: 2 },
      { variationId: recipeVariations[10].id, ingredientId: getIngredient('Ketchup').id, quantity: 20 },
    ])

    // Chicken Deluxe Burger Recipes
    await Recipe.createMany([
      // Grilled Chicken
      { variationId: recipeVariations[11].id, ingredientId: getIngredient('Burger Bun').id, quantity: 1 },
      { variationId: recipeVariations[11].id, ingredientId: getIngredient('Chicken Breast').id, quantity: 1 },
      { variationId: recipeVariations[11].id, ingredientId: getIngredient('Lettuce').id, quantity: 2 },
      { variationId: recipeVariations[11].id, ingredientId: getIngredient('Tomato Slices').id, quantity: 2 },
      { variationId: recipeVariations[11].id, ingredientId: getIngredient('Bacon').id, quantity: 2 },
      { variationId: recipeVariations[11].id, ingredientId: getIngredient('Cheddar Cheese').id, quantity: 1 },
      { variationId: recipeVariations[11].id, ingredientId: getIngredient('Mayo').id, quantity: 20 },
      
      // Crispy Chicken
      { variationId: recipeVariations[12].id, ingredientId: getIngredient('Burger Bun').id, quantity: 1 },
      { variationId: recipeVariations[12].id, ingredientId: getIngredient('Chicken Breast').id, quantity: 1 },
      { variationId: recipeVariations[12].id, ingredientId: getIngredient('Lettuce').id, quantity: 2 },
      { variationId: recipeVariations[12].id, ingredientId: getIngredient('Tomato Slices').id, quantity: 2 },
      { variationId: recipeVariations[12].id, ingredientId: getIngredient('Bacon').id, quantity: 2 },
      { variationId: recipeVariations[12].id, ingredientId: getIngredient('Cheddar Cheese').id, quantity: 1 },
      { variationId: recipeVariations[12].id, ingredientId: getIngredient('Mayo').id, quantity: 20 },
    ])

    // Pasta Recipes
    await Recipe.createMany([
      // Spaghetti Carbonara Regular
      { variationId: recipeVariations[13].id, ingredientId: getIngredient('Spaghetti').id, quantity: 200 },
      { variationId: recipeVariations[13].id, ingredientId: getIngredient('Bacon').id, quantity: 3 },
      { variationId: recipeVariations[13].id, ingredientId: getIngredient('Parmesan Cheese').id, quantity: 50 },
      
      // Spaghetti Carbonara Large
      { variationId: recipeVariations[14].id, ingredientId: getIngredient('Spaghetti').id, quantity: 300 },
      { variationId: recipeVariations[14].id, ingredientId: getIngredient('Bacon').id, quantity: 5 },
      { variationId: recipeVariations[14].id, ingredientId: getIngredient('Parmesan Cheese').id, quantity: 75 },
      
      // Penne Alfredo Regular
      { variationId: recipeVariations[15].id, ingredientId: getIngredient('Penne').id, quantity: 200 },
      { variationId: recipeVariations[15].id, ingredientId: getIngredient('Alfredo Sauce').id, quantity: 150 },
      { variationId: recipeVariations[15].id, ingredientId: getIngredient('Grilled Chicken').id, quantity: 100 },
      { variationId: recipeVariations[15].id, ingredientId: getIngredient('Parmesan Cheese').id, quantity: 30 },
      
      // Penne Alfredo Large
      { variationId: recipeVariations[16].id, ingredientId: getIngredient('Penne').id, quantity: 300 },
      { variationId: recipeVariations[16].id, ingredientId: getIngredient('Alfredo Sauce').id, quantity: 200 },
      { variationId: recipeVariations[16].id, ingredientId: getIngredient('Grilled Chicken').id, quantity: 150 },
      { variationId: recipeVariations[16].id, ingredientId: getIngredient('Parmesan Cheese').id, quantity: 50 },
    ])

    // Salad Recipes
    await Recipe.createMany([
      // Caesar Salad Small
      { variationId: recipeVariations[17].id, ingredientId: getIngredient('Mixed Greens').id, quantity: 100 },
      { variationId: recipeVariations[17].id, ingredientId: getIngredient('Croutons').id, quantity: 30 },
      { variationId: recipeVariations[17].id, ingredientId: getIngredient('Parmesan Cheese').id, quantity: 25 },
      { variationId: recipeVariations[17].id, ingredientId: getIngredient('Caesar Dressing').id, quantity: 30 },
      
      // Caesar Salad Large
      { variationId: recipeVariations[18].id, ingredientId: getIngredient('Mixed Greens').id, quantity: 200 },
      { variationId: recipeVariations[18].id, ingredientId: getIngredient('Croutons').id, quantity: 50 },
      { variationId: recipeVariations[18].id, ingredientId: getIngredient('Parmesan Cheese').id, quantity: 40 },
      { variationId: recipeVariations[18].id, ingredientId: getIngredient('Caesar Dressing').id, quantity: 50 },
      { variationId: recipeVariations[18].id, ingredientId: getIngredient('Grilled Chicken').id, quantity: 100 },
    ])

    // Dessert Recipes
    await Recipe.createMany([
      // Chocolate Cake Single Slice
      { variationId: recipeVariations[23].id, ingredientId: getIngredient('Chocolate Cake Base').id, quantity: 1 },
      { variationId: recipeVariations[23].id, ingredientId: getIngredient('Chocolate Sauce').id, quantity: 20 },
      { variationId: recipeVariations[23].id, ingredientId: getIngredient('Whipped Cream').id, quantity: 30 },
      
      // Chocolate Cake Double Slice
      { variationId: recipeVariations[24].id, ingredientId: getIngredient('Chocolate Cake Base').id, quantity: 2 },
      { variationId: recipeVariations[24].id, ingredientId: getIngredient('Chocolate Sauce').id, quantity: 40 },
      { variationId: recipeVariations[24].id, ingredientId: getIngredient('Whipped Cream').id, quantity: 50 },
      { variationId: recipeVariations[24].id, ingredientId: getIngredient('Strawberries').id, quantity: 3 },
      { variationId: recipeVariations[24].id, ingredientId: getIngredient('Vanilla Ice Cream').id, quantity: 2 },
    ])

    // Create Extras for Products
    await Extra.createMany([
      // Pizza Extras
      { name: 'Extra Cheese', price: '2.50', quantity: 50, productId: products[0].id, ingredientId: getIngredient('Mozzarella Cheese').id },
      { name: 'Extra Pepperoni', price: '3.00', quantity: 5, productId: products[0].id, ingredientId: getIngredient('Pepperoni').id },
      { name: 'Extra Mushrooms', price: '2.00', quantity: 30, productId: products[0].id, ingredientId: getIngredient('Mushrooms').id },
      
      { name: 'Extra Cheese', price: '2.50', quantity: 50, productId: products[1].id, ingredientId: getIngredient('Mozzarella Cheese').id },
      { name: 'Extra Pepperoni', price: '3.00', quantity: 5, productId: products[1].id, ingredientId: getIngredient('Pepperoni').id },
      { name: 'Extra Mushrooms', price: '2.00', quantity: 30, productId: products[1].id, ingredientId: getIngredient('Mushrooms').id },
      
      { name: 'Extra Cheese', price: '2.50', quantity: 50, productId: products[2].id, ingredientId: getIngredient('Mozzarella Cheese').id },
      { name: 'Extra Mushrooms', price: '2.00', quantity: 30, productId: products[2].id, ingredientId: getIngredient('Mushrooms').id },
      { name: 'Extra Bell Peppers', price: '1.50', quantity: 25, productId: products[2].id, ingredientId: getIngredient('Bell Peppers').id },
      
      // Burger Extras
      { name: 'Extra Cheese', price: '1.50', quantity: 1, productId: products[3].id, ingredientId: getIngredient('Cheddar Cheese').id },
      { name: 'Extra Bacon', price: '2.50', quantity: 2, productId: products[3].id, ingredientId: getIngredient('Bacon').id },
      { name: 'Extra Pickles', price: '0.50', quantity: 5, productId: products[3].id, ingredientId: getIngredient('Pickles').id },
      
      { name: 'Extra Cheese', price: '1.50', quantity: 1, productId: products[4].id, ingredientId: getIngredient('Cheddar Cheese').id },
      { name: 'Extra Bacon', price: '2.50', quantity: 2, productId: products[4].id, ingredientId: getIngredient('Bacon').id },
      { name: 'Avocado', price: '2.00', quantity: 50, productId: products[4].id, ingredientId: getIngredient('Mixed Greens').id },
      
      // Pasta Extras
      { name: 'Extra Chicken', price: '4.00', quantity: 100, productId: products[5].id, ingredientId: getIngredient('Grilled Chicken').id },
      { name: 'Extra Bacon', price: '3.00', quantity: 3, productId: products[5].id, ingredientId: getIngredient('Bacon').id },
      
      { name: 'Extra Chicken', price: '4.00', quantity: 100, productId: products[6].id, ingredientId: getIngredient('Grilled Chicken').id },
      { name: 'Extra Parmesan', price: '2.00', quantity: 30, productId: products[6].id, ingredientId: getIngredient('Parmesan Cheese').id },
      
      // Salad Extras
      { name: 'Grilled Chicken', price: '4.00', quantity: 100, productId: products[7].id, ingredientId: getIngredient('Grilled Chicken').id },
      { name: 'Extra Croutons', price: '1.00', quantity: 20, productId: products[7].id, ingredientId: getIngredient('Croutons').id },
      { name: 'Cherry Tomatoes', price: '1.50', quantity: 5, productId: products[7].id, ingredientId: getIngredient('Cherry Tomatoes').id },
      { name: 'Cucumber', price: '1.00', quantity: 10, productId: products[7].id, ingredientId: getIngredient('Cucumber').id },
      
      // Dessert Extras
      { name: 'Extra Ice Cream', price: '2.50', quantity: 1, productId: products[9].id, ingredientId: getIngredient('Vanilla Ice Cream').id },
      { name: 'Extra Strawberries', price: '2.00', quantity: 3, productId: products[9].id, ingredientId: getIngredient('Strawberries').id },
      { name: 'Extra Chocolate Sauce', price: '1.50', quantity: 20, productId: products[9].id, ingredientId: getIngredient('Chocolate Sauce').id },
      { name: 'Whipped Cream', price: '1.00', quantity: 30, productId: products[9].id, ingredientId: getIngredient('Whipped Cream').id },
    ])

    console.log('✅ Food delivery app sample data seeded successfully!')
    console.log(`📊 Created:`)
    console.log(`   - ${categories.length} categories`)
    console.log(`   - ${ingredients.length} ingredients`)
    console.log(`   - ${products.length} products`)
    console.log(`   - ${pizzaVariations.length} variations`)
    console.log(`   - Multiple recipes and extras`)
    console.log(`   - Stock entries for all ingredients and non-recipe variations`)
  }
}