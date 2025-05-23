import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm' 
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
// import { BaseModel, column, manyToMany, ManyToMany } from '@ioc:Adonis/Lucid/Orm'
import Product from './product.js'

export default class Category extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => Product, {
    pivotTable: 'category_product',
    pivotTimestamps: true,
  })
  declare products: ManyToMany<typeof Product>
}