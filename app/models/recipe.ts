import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, HasMany, belongsTo, BelongsTo } from '@adonisjs/lucid/orm'
// import type HasMany from '@adonisjs/lucid/orm'

import Variation from './variation.js'
import StockItem from '#models/stock_item'

export default class Recipe extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare variationId: number

  @column()
  declare stockItemId: number

  @column()
  declare quantity: number

  @belongsTo(() => Variation)
  declare variation: BelongsTo<typeof Variation>

  @belongsTo(() => StockItem)
  declare stockItem: BelongsTo<typeof StockItem>
}