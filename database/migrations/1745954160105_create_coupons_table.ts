import { BaseSchema } from "@adonisjs/lucid/schema";

export default class Coupons extends BaseSchema {
  protected tableName = "coupons";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.string("code").notNullable().unique();
      table.string("discount_type").notNullable();
      table.string("discount_value").notNullable();
      table.integer("quantity").defaultTo(100).nullable();
      table.string("minimum_purchase").defaultTo(0).notNullable();

      table.date("start_date").notNullable();
      table.date("end_date").notNullable();

      table.timestamps(true, true);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
