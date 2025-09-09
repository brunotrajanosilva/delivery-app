// import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "categories";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.string("name").notNullable();
      table.string("description").notNullable();

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      // table.timestamp("created_at", { useTz: true });
      // table.timestamp("updated_at", { useTz: true });
      table.timestamps(true, true);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}

/* 

git mv oldName newName

newNames:
1745954160100_create_ingredients_table.ts
1745954160101_create_categories_table.ts
1745954160103_create_products_table.ts  
1745954160104_create_users_table.ts
1745954160105_create_coupons_table.ts
1745954160106_create_stocks_table.ts
1745954160107_create_delivery_workers_table.ts


1745954160110_create_category_products_table.ts 
1745954160111_create_variations_table.ts         
1745954160112_create_extras_table.ts             
1745954160113_create_orders_table.ts             
1745954160114_create_access_tokens_table.ts
1745954160115_create_cart_items_table.ts         
1745954160116_create_delivery_orders_table.ts
1745954160117_create_recipes_table.ts


1745954160200_create_order_items_table.ts        
1745954160201_create_cart_item_extras_table.ts   



old names:
1745954160100_create_categories_table.ts         1746291353529_create_order_items_table.ts       1748821194850_create_recipes_table.ts
1745954173241_create_products_table.ts           1746304828400_create_cart_items_table.ts        1748821236146_create_stocks_table.ts
1746135513992_create_category_products_table.ts  1746331967580_create_cart_item_extras_table.ts  1748997773833_create_ingredients_table.ts
1746220584183_create_variations_table.ts         1746645774017_create_users_table.ts             1749744694010_create_delivery_orders_table.ts
1746224115830_create_extras_table.ts             1746645774022_create_access_tokens_table.ts     1749744926851_create_delivery_workers_table.ts
1746291350256_create_orders_table.ts             1747494916064_create_coupons_table.ts

# Rename migration files to new timestamp order

# Ingredients table
git mv 1748997773833_create_ingredients_table.ts 1745954160100_create_ingredients_table.ts

# Categories table  
git mv 1745954160100_create_categories_table.ts 1745954160101_create_categories_table.ts

# Products table
git mv 1745954173241_create_products_table.ts 1745954160103_create_products_table.ts

# Users table
git mv 1746645774017_create_users_table.ts 1745954160104_create_users_table.ts

# Coupons table
git mv 1747494916064_create_coupons_table.ts 1745954160105_create_coupons_table.ts

# Stocks table
git mv 1748821236146_create_stocks_table.ts 1745954160106_create_stocks_table.ts

# Delivery workers table
git mv 1749744926851_create_delivery_workers_table.ts 1745954160107_create_delivery_workers_table.ts

# Category products table
git mv 1746135513992_create_category_products_table.ts 1745954160110_create_category_products_table.ts

# Variations table
git mv 1746220584183_create_variations_table.ts 1745954160111_create_variations_table.ts

# Extras table
git mv 1746224115830_create_extras_table.ts 1745954160112_create_extras_table.ts

# Orders table
git mv 1746291350256_create_orders_table.ts 1745954160113_create_orders_table.ts

# Access tokens table
git mv 1746645774022_create_access_tokens_table.ts 1745954160114_create_access_tokens_table.ts

# Cart items table
git mv 1746304828400_create_cart_items_table.ts 1745954160115_create_cart_items_table.ts

# Delivery orders table
git mv 1749744694010_create_delivery_orders_table.ts 1745954160116_create_delivery_orders_table.ts

# Recipes table
git mv 1748821194850_create_recipes_table.ts 1745954160117_create_recipes_table.ts

# Order items table
git mv 1746291353529_create_order_items_table.ts 1745954160200_create_order_items_table.ts

# Cart item extras table
git mv 1746331967580_create_cart_item_extras_table.ts 1745954160201_create_cart_item_extras_table.ts
*/
