import type { HttpContext } from "@adonisjs/core/http";
import Product from "#models/product/product";
import redis from "@adonisjs/redis/services/main";
import { productsIndexValidator } from "#validators/product";
import { itemIdValidator } from "#validators/itemId";

export default class ProductsController {
  async index({ request, response }: HttpContext) {
    await request.validateUsing(productsIndexValidator);

    try {
      const page = request.input("page", 1);
      const limit = request.input("limit", 10);
      const search = request.input("search", null);
      const categoryId = request.input("category_id", null);
      const sortBy = request.input("sort_by", "created_at");
      const sortOrder = request.input("sort_order", "desc");

      const cacheKey = `products:${page}:${limit}:${search}:${categoryId}:${sortBy}:${sortOrder}`;
      const cachedProducts = await redis.get(cacheKey);
      if (cachedProducts) {
        return response.ok(JSON.parse(cachedProducts));
      }

      let query = Product.query();

      if (categoryId) {
        query.whereHas("categories", (builder) => {
          builder.where("categories.id", categoryId);
        });
      }

      if (search) {
        query
          .where("name", "LIKE", `%${search}%`)
          .orWhere("description", "LIKE", `%${search}%`);
      }

      query.preload("categories");
      query.preload("variations");
      query.preload("extras");
      query.orderBy(sortBy, sortOrder);

      const products = await query.paginate(page, limit);
      await redis.setex(cacheKey, 3600, JSON.stringify(products));
      return response.ok(products);
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: "Failed to fetch products",
        error: error.message,
      });
    }
  }

  async show({ params, response }: HttpContext) {
    await itemIdValidator.validate({ id: params.id });
    try {
      const cacheKey = `product:${params.id}`;
      const cachedProduct = await redis.get(cacheKey);
      if (cachedProduct) {
        return response.ok(JSON.parse(cachedProduct));
      }

      const product = await Product.query()
        .where("id", params.id)
        .preload("categories")
        .preload("variations")
        .preload("extras")
        .firstOrFail();

      await redis.setex(cacheKey, 3600, JSON.stringify(product));
      return response.ok(product);
    } catch (error) {
      return response.notFound({
        success: false,
        message: "Product not found",
      });
    }
  }
}
