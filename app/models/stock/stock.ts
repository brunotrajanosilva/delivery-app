import { DateTime } from "luxon";
import { BaseModel, column } from "@adonisjs/lucid/orm";

export default class Stock extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare itemId: number;

  @column()
  declare itemType: "variation" | "ingredient";

  @column()
  declare available: number;

  @column()
  declare reserved: number;

  @column()
  declare lowStock: number;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
