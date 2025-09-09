import { BaseSchema } from "@adonisjs/lucid/schema";

export default class CreateOrderItems extends BaseSchema {
  protected tableName = "order_items";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");

      table
        .integer("order_id")
        .unsigned()
        .references("id")
        .inTable("orders")
        .onDelete("CASCADE");

      table
        .integer("variation_id")
        .unsigned()
        .references("id")
        .inTable("variations")
        .onDelete("SET NULL");

      table.jsonb("details");
      table.integer("quantity").notNullable();
      table.string("total").notNullable();

      table.timestamps(true, true);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
