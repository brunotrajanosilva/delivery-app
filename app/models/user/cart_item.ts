import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { HasMany } from '@adonisjs/lucid/types/relations'

import User from '#models/user/user'
import Product from '#models/product/product'
import Variation from '#models/product/variation'
import Extra from '#models/product/extra'

import type { CartItemExtras } from '../../types/requests/cart_item.js'
import type Details from "#types/details"
// import CartItemExtra from '#models/cart_item_extra'


// json request body
/* 

CartItem: {
  productId: number
  quantity: number
  detail: {
    variation: number
    extras: [extraId: number, quantity: number]
  }
}



*/

export default class CartItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare productId: number

  @column()
  declare quantity: number

  @column()
  declare details: string

  @column()
  declare total: string

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  // @belongsTo(() => Variation)
  // declare variation: BelongsTo<typeof Variation>

  // @hasMany(() => CartItemExtra)
  // declare extras: HasMany<typeof CartItemExtra>

  @column.dateTime({ autoCreate: true })
  declare createdAt: Date

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: Date

  // STATIC --------------------------------
  public static async getRelations(productId: number, detailsJson: any){
    const product = await this.getProduct(productId)
    const details = await this.getDetails(product, detailsJson)

    return {product, details}
  }

  private static async getProduct(productId: number): Promise<Product> {
    const product = await Product.find(productId)

    if (!product) {
      throw new Error('Product not found')
      // return null
    }
    return product
  }

  private static async getDetails(product: Product, details: any) {
    let detailsResult: any = {variation: null, extras: []}
    // const detailsParsed:Details = JSON.parse(details) 
    
    if(details.variation ){
      const variation = await Variation.query()
        .where("id", details.variation)
        .where("productId", product.id)

      if (!variation) {
        throw new Error('Variation not found')
      }

      detailsResult.variation = variation
    }

    if(details.extras){
      let extras = []

      for( const extra of details.extras){
        const extraObj = await Extra.query()
        .where("id", extra.id)
        .where("productId", product.id)

        extras.push({extraObj, id: extra.id, quantity: extra.quantity})
        detailsResult.extras = extras
      }
    }

    return detailsResult

  }
  // INSTANCE ----------------------
  public getThisRelations(){
    const parsedDetails = JSON.parse(this.details)
    const result = CartItem.getRelations(this.productId, parsedDetails)
    return result
  }
  // --------------------------------

  public async getParsedDetails() {
    const detailsObj: any = JSON.parse(this.details)
    const product = await Product.find(detailsObj.productId)

    if(!product){
      throw("Product not found")
    }

    // return detailsObj

    if (detailsObj.get("variation")) {
      const variationOjb = await product.getVariationById(detailsObj.variation)
      console.log("variationOjb", variationOjb)
      detailsObj.variation = variationOjb
    }

    if (detailsObj.extras) {
      
      for(const extra in detailsObj.extras){
        const extraObj = await product.getExtraById(extra.id)
        extra.obj = extraObj 
      }
    }

    return detailsObj

  
    // let result = {variation:<null | Variation> null, extras: []}

    // if (detailsObj.variation) {
    //   const variationOjb = await product.getVariationById(detailsObj.variation)
    //   result.variation = variationOjb
    // }
  
    // if (detailsObj.extras) {
      
    //   for(const extra in detailsObj.extras){
    //     const extraObj = await product.getExtraById(extra.id)
    //     result.extras.push( extraObj )
    //   }
    // }
  
    // return result
  }

  private async getVariationStocks(product: Product, id: number ){
    const variationOjb = await product.getVariationById(id)
    return variationOjb.getVariationStocks()
  }

  private async getExtraStocks(product: Product, id: number ){
    const extraObj = await product.getExtraById(id)
    return extraObj.getVariationStocks()
  }

  
}
