// import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import { BaseSchema } from "@adonisjs/lucid/schema";

export default class CategoryProduct extends BaseSchema {
  protected tableName = "category_product";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");

      table
        .integer("product_id")
        .unsigned()
        .references("id")
        .inTable("products")
        .onDelete("CASCADE");
      table
        .integer("category_id")
        .unsigned()
        .references("id")
        .inTable("categories")
        .onDelete("CASCADE");

      table.unique(["product_id", "category_id"]);

      table.timestamps(true, true);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
