import { DateTime } from "luxon";
import { BaseModel, column, manyToMany, hasMany } from "@adonisjs/lucid/orm";
import type { ManyToMany, HasMany } from "@adonisjs/lucid/types/relations";

import Category from "#models/product/category";
import Variation from "#models/product/variation";
import Extra from "#models/product/extra";
import type { RequestParams } from "#types/requests/params";

export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column()
  declare price: string;

  @column()
  declare description: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @manyToMany(() => Category, {
    pivotTable: "category_product",
    pivotTimestamps: true,
  })
  declare categories: ManyToMany<typeof Category>;

  @hasMany(() => Variation)
  declare variations: HasMany<typeof Variation>;

  @hasMany(() => Extra)
  declare extras: HasMany<typeof Extra>;

  /*********** methods **********/

  public static async getProducts(): Promise<Product[]> {
    const query = Product.query()
      .preload("categories")
      .preload("variations")
      .preload("extras");

    // if (requestParams.search) query.where('name', 'like', `%${requestParams.search}%`)

    // if (requestParams.categoryId) query.where('categories.id', requestParams.categoryId)

    // if (requestParams.sortBy) query.orderBy(requestParams.sortBy, requestParams.sortOrder)

    // if (requestParams.page && requestParams.limit)
    //   query.paginate(requestParams.page, requestParams.limit)

    return query;
  }

  public static async getProduct(): Promise<Product> {
    const query = await Product.query()
      .preload("categories")
      .preload("variations")
      .preload("extras")
      .first();

    if (!query) throw new Error("Products not found");
    return query;
  }
  //   ==============
  public productDescription() {
    const productDescription = {
      id: this.id,
      name: this.name,
      price: this.price,
      /* categories: this.categories.map(category => ({
        id: category.id,
        name: category.name
      })), */
    };
    return JSON.stringify(productDescription, null, 2);
  }

  public async getVariationById(id: number): Promise<Variation> {
    const variation = await Variation.query()
      .where("id", id)
      .where("product_id", this.id)
      .first();
    // const variation = await this.related("variations").query().where("id", id).first()

    if (!variation) {
      throw new Error("Variation not found");
    }

    return variation;
  }

  public async getExtraById(id: number): Promise<Extra> {
    const extra = await Extra.query()
      .where("id", id)
      .where("product_id", this.id)
      .first();

    if (!extra) {
      throw new Error("Extra not found");
    }

    return extra;
  }

  // // select product
  // static async findProductById(productId: number) {
  //   const product = await Product.find(productId)
  //   if (!product) {
  //     throw new Error('Product not found')
  //   }
  //   return product
  // }

  // // select product variation
  // // private find

  // // select products extras
  // public async findExtrasByIds(extrasId: number[]) {
  //   return this.related("extras").query().whereIn('id', extrasId)
  // }
  //
}
