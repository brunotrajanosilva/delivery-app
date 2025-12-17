import { BaseSchema } from "@adonisjs/lucid/schema";

export default class CreateOrders extends BaseSchema {
  protected tableName = "orders";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.uuid("uuid").notNullable().unique();

      table
        .integer("user_id")
        .unsigned()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");

      table.string("total_price").notNullable();

      table
        .integer("coupon_id")
        .unsigned()
        .references("id")
        .inTable("coupons")
        .onDelete("SET NULL")
        .nullable();

      table.string("coupon_discount").nullable();
      table.string("total_to_pay").notNullable();
      table.string("payment_status").notNullable();
      table.string("payment_gateway").notNullable();
      table.string("payment_id").notNullable();
      table.date("expiration_date").nullable();

      table.timestamps(true, true);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
