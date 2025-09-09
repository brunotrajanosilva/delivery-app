import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "ingredients";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.string("name").notNullable();
      table.string("unit").notNullable();
      table.timestamps(true, true);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
