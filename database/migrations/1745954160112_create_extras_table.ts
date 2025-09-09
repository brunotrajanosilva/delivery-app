import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "extras";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.string("name").notNullable();
      table
        .integer("product_id")
        .unsigned()
        .references("id")
        .inTable("products")
        .notNullable()
        .onDelete("CASCADE");
      table
        .integer("ingredient_id")
        .unsigned()
        .references("id")
        .inTable("ingredients")
        .notNullable()
        .onDelete("CASCADE");
      table.integer("quantity").notNullable().unsigned();
      table.string("price").notNullable();
      table.timestamps(true, true);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
