import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { HasMany } from '@adonisjs/lucid/types/relations'

import User from '#models/user/user'
import Product from '#models/product/product'
import Variation from '#models/product/variation'

import type { CartItemExtras } from '../../types/requests/cart_item.js'
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
