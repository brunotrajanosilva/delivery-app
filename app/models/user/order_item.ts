import { BaseModel, column, belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import Order from "#models/user/order";
import Variation from "#models/product/variation";
import { DateTime } from "luxon";
import type { OrderItemDetails } from "#types/order";

export default class OrderItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare orderId: number;

  @column()
  declare variationId: number;

  @column()
  declare details: OrderItemDetails;

  @column()
  declare quantity: number;

  @column()
  declare total: string;

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>;

  @belongsTo(() => Variation)
  declare product: BelongsTo<typeof Variation>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
