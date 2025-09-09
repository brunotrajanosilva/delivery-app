import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "recipes";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table
        .integer("variation_id")
        .unsigned()
        .references("id")
        .inTable("variations")
        .onDelete("CASCADE");

      table
        .integer("ingredient_id")
        .unsigned()
        .references("id")
        .inTable("ingredients")
        .onDelete("CASCADE");

      table.integer("quantity").unsigned().notNullable(); // how much of this stock item is needed for the product

      table.timestamps(true, true);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
