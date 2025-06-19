import { DateTime } from 'luxon'
import { BaseModel, column, hasOne } from '@adonisjs/lucid/orm'
import type { HasOne } from '@adonisjs/lucid/types/relations'
import Stock from "#models/stock/stock"

export default class Ingredient extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare unit: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // need to reforce a constraint OneToOne

  @hasOne(()=> Stock, {
    foreignKey: 'itemId', 
    onQuery: (query) => {
      query.where('item_type', 'ingredient')
    },
  })
  declare stock: HasOne<typeof Stock>
}