import { BaseModel, column, belongsTo, hasOne, hasMany} from '@adonisjs/lucid/orm'

import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import Product from '#models/product/product'
import Stock from '#models/stock/stock'
import Recipe from '#models/stock/recipe'



export default class Variation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare price: string

  @column()
  declare isRecipe: boolean

  @column()
  declare productId: number

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @hasOne(()=> Stock, {
    foreignKey: 'itemId',
    onQuery: (query) => {
      query.where('item_type', 'variation')
    },
  })
  declare stock: HasOne<typeof Stock>

  @hasMany(() => Recipe)
  declare recipe: HasMany<typeof Recipe>

  // has stock

  public async getStockableIngredients(){
    /* const instanceLoaded = await this.load((loader) => {
      loader
        .load('stock')
        .load('recipe', (recipeQuery) => {
          recipeQuery.preload('ingredient', (ingredientQuery) => {
            ingredientQuery.preload('stock')
          })
        })
    })   */
    return instanceLoaded

    if (this.stock) {
      return [this.stock]
    }

    if (this.recipe) {
      return this.recipe.load("ingredient")
    }

  }

  public async getRecipe(): Promise<Recipe | Variation[]> {
    // Ensure recipe relation is loaded
    if (!this.$preloaded.recipe) {
      await this.load('recipe')
    }
  
    if (this.recipe && this.recipe.length > 0) {
      return this.recipe
    }

    return [this]
    
  }

  // deduct stock and its deduct method: query the stock or recipe > ingredient > stock. 
}
