import {
  BaseModel,
  column,
  belongsTo,
  hasOne,
  hasMany,
} from "@adonisjs/lucid/orm";

import type {
  BelongsTo,
  HasMany,
  HasOne,
} from "@adonisjs/lucid/types/relations";
import Product from "#models/product/product";
import Stock from "#models/stock/stock";
import Recipe from "#models/stock/recipe";
import { DateTime } from "luxon";

export default class Variation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column()
  declare price: string;

  @column()
  declare isRecipe: boolean;

  @column()
  declare productId: number;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>;

  @hasOne(() => Stock, {
    foreignKey: "itemId",
    onQuery: (query) => {
      query.where("item_type", "variation");
    },
  })
  declare stock: HasOne<typeof Stock>;

  @hasMany(() => Recipe)
  declare recipe: HasMany<typeof Recipe>;
}
