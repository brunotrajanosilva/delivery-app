import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany, hasMany } from '@adonisjs/lucid/orm'
import type { ManyToMany, HasMany } from '@adonisjs/lucid/types/relations'

import Category from './category.js'
import Variation from '#models/variation'
import Extra from '#models/extra'


export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare price: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => Category, {
    pivotTable: 'category_product',
    pivotTimestamps: true,
  })
  declare categories: ManyToMany<typeof Category>

  @hasMany(() => Variation)
  declare variations: HasMany<typeof Variation>

  @hasMany(() => Extra)
  declare extras: HasMany<typeof Extra>


  /*********** methods **********/
  public productDescription() {
    const productDescription = {
      id: this.id,
      name: this.name,
      price: this.price,
      /* categories: this.categories.map(category => ({
        id: category.id,
        name: category.name
      })), */
    }
    return JSON.stringify(productDescription, null, 2)
  }

  // // select product
  // static async findProductById(productId: number) {
  //   const product = await Product.find(productId)
  //   if (!product) {
  //     throw new Error('Product not found')
  //   }
  //   return product
  // }

  // // select product variation
  // // private find


  // // select products extras
  // public async findExtrasByIds(extrasId: number[]) {
  //   return this.related("extras").query().whereIn('id', extrasId)
  // }
  // 
}