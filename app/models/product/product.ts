import { DateTime } from "luxon";
import { BaseModel, column, manyToMany, hasMany } from "@adonisjs/lucid/orm";
import type { ManyToMany, HasMany } from "@adonisjs/lucid/types/relations";

import Category from "#models/product/category";
import Variation from "#models/product/variation";
import Extra from "#models/product/extra";

export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column()
  declare price: string;

  @column()
  declare description: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @manyToMany(() => Category, {
    pivotTable: "category_product",
    pivotTimestamps: true,
  })
  declare categories: ManyToMany<typeof Category>;

  @hasMany(() => Variation)
  declare variations: HasMany<typeof Variation>;

  @hasMany(() => Extra)
  declare extras: HasMany<typeof Extra>;
}
