import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "stocks";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.integer("item_id").unsigned().notNullable();
      table.string("item_type").notNullable();

      table.integer("available").notNullable().unsigned();
      table.integer("reserved").notNullable().unsigned();
      table.integer("low_stock").notNullable().unsigned();
      table.timestamps(true, true);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
