import Order from "#models/order";
import OrderItem from "#models/user/order_item";
import CartItem from "#models/user/cart_item";
import Recipe from "#models/stock/recipe";
import Stock from "#models/stock/stock";
import Extra from "#models/product/extra";

import type { CartItemPayload } from "../types/requests/cart_item.js";
import { Database } from "@adonisjs/lucid/database";


// cancel order not paid when there is no stock. that occurs because the system permits more than available stock to be ordered
 
export default class StockService {

    // workflow
    // receive payment webhook: set order status > deduct stock > create delivery order 

    // get stock items
    // get low stocks
    // get stock item by id

    // change stock item quantity

    // TRANSFORM ORDER INPUT, GET RECIPE STOCK ITENS AND DELETE THEM

    

    private async getItemsIgredients(items: CartItem[] | OrderItem[]){

        const ingredientMap = new Map<number, number>()
        const variationIngredientMap = new Map<number, number>()

        for(const item of items){

            const {variation, extras} = await item.getParsedDetails()
            // console.log("parsed", variation)
            // const variation = details.variation
            // const extras = details.extras
    
            if(variation.isRecipe){
                const variationIngredients = await this.getVariationIngredients(variation.id, item.quantity)
    
                for(const ingredient of variationIngredients){
                    const { ingredientId, quantity } = ingredient
    
                    ingredientMap.set(ingredientId, ingredientMap.get(ingredientId) || 0 + quantity)

                    // if(ingredientMap.has(ingredientId)){
                    //     ingredientMap.set(ingredientId, ingredientMap.get(ingredientId) + quantity)
                    // } else {
                    //     ingredientMap.set(ingredientId, quantity)
                    // }
                }
            }

            if (!variation.isRecipe){
                variationIngredientMap.set(variation.id, (ingredientMap.get(variation.id) || 0) + item.quantity)
            }
    
            if(extras.length > 0){
                const extraIngredients = await this.getExtraIngredients(extras, item.quantity)
                // console.log(extraIngredients)

    
                for(const ingredient of extraIngredients){
                    const {ingredientId, quantity} = ingredient
                    // console.log(ingredientMap.get(ingredientId))


    
                    ingredientMap.set(ingredientId, (ingredientMap.get(ingredientId) || 0) + quantity)
                    // ingredientMap.set(test.ingredientId, 10000)

                    // if(ingredientMap.has(ingredientId)){
                    // } else {
                    //     ingredientMap.set(ingredientId, quantity)
                    // }
                }
            }
        }
        
        const result = {ingredientMap, variationIngredientMap}
        // console.log(result)
        return result
    }


    private async getVariationIngredients(variation_id: number, item_quantity: number){
        const recipeItems = await Recipe.query().where("variation_id", variation_id).preload("ingredient")
        const ingredients = []

        for(const recipeItem of recipeItems){
            const ingredientId = recipeItem.ingredient.id
            const quantity = recipeItem.quantity * item_quantity

            ingredients.push( { ingredientId, quantity } )

        } 
        // console.log("get variation", ingredients)
        
        return ingredients
    }

    private async getExtraIngredients(extras, item_quantity: number){

        const ingredients = []

        for(const extra of extras){
            const productExtra = await Extra.query().where("id", extra.id).preload("ingredient").first()
            if (!productExtra) throw new Error("Extra not found")

            const ingredientId = productExtra.ingredient.id
            const quantity = productExtra.quantity * extra.quantity * item_quantity

            console.log("quantity", productExtra.quantity, extra.quantity, item_quantity)

            ingredients.push( { ingredientId, quantity } )
        }
        return ingredients
    }

    private async checkStock(map: Map<number, number>, type: string){
        for(const [ingredientId, quantity] of map.entries()){
            const stock = await Stock.query().where("itemId", ingredientId).where("itemType", type).first()

            if (!stock) {
                throw new Error(`No stock found for ingredient ID ${ingredientId}`)
            }

            const hasStock = stock.hasStock(quantity)
            return hasStock
        }
    }

    private async discountStock(map: Map<number, number>, type: string){
        for(const [ingredientId, quantity] of map.entries()){
            const stock = await Stock.query().where("itemId", ingredientId).where("itemType", type).first()

            if (!stock) {
                throw new Error(`No stock found for ingredient ID ${ingredientId}`)
            }

            await stock.subtractQuantity(quantity)
        }
    }

    public async cartItemsisInStock(items: CartItem[]): Promise<boolean> {

        const {ingredientMap, variationIngredientMap} = await this.getItemsIgredients(items)

        await this.checkStock(ingredientMap, "ingredient")
        await this.checkStock(variationIngredientMap, "variation")
        return true
    }

    public async orderItemsDiscountStock(items: OrderItem[]): Promise<boolean>{
        const {ingredientMap, variationIngredientMap} = await this.getItemsIgredients(items)

        // transaction
    
        await this.checkStock(ingredientMap, "ingredient")
        await this.checkStock(variationIngredientMap, "variation")

        await this.discountStock(ingredientMap, "ingredient")
        await this.discountStock(variationIngredientMap, "variation")
        return true

    }

}