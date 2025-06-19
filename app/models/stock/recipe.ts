import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

// import type HasMany from '@adonisjs/lucid/orm'

import Variation from '#models/product/variation'
import Ingredient from '#models/stock/ingredient'

export default class Recipe extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare variationId: number

  @column()
  declare ingredientId: number

  @column()
  declare quantity: number


  // should be unique together
  @belongsTo(() => Variation)
  declare variation: BelongsTo<typeof Variation>

  @belongsTo(() => Ingredient)
  declare ingredient: BelongsTo<typeof Ingredient>

  
}