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

      const query = Product.query()
        .preload("categories")
        .preload("variations")
        .preload("extras");

      if (categoryId) {
        query.where("category_id", categoryId);
      }
      if (search) {
        query
          .where("name", "ILIKE", `%${search}%`)
          .orWhere("description", "ILIKE", `%${search}%`);
      }

      query.orderBy(sortBy, sortOrder);

      const cacheKey = `products:${page}:${limit}:${search}:${categoryId}:${sortBy}:${sortOrder}`;
      const cachedProducts = await redis.get(cacheKey);
      if (cachedProducts) {
        return response.ok(JSON.parse(cachedProducts));
      }

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
      const product = await Product.query()
        .where("id", params.id)
        .preload("categories")
        .preload("variations")
        .preload("extras")
        .firstOrFail();

      const cacheKey = `product:${product.id}`;
      const cachedProduct = await redis.get(cacheKey);
      if (cachedProduct) {
        return response.ok(JSON.parse(cachedProduct));
      }

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
