// app/controllers/products_controller.ts
import type { HttpContext } from "@adonisjs/core/http";
import Product from "#models/product/product";
import ResponseHelper from "#helpers/responses/responses_helper";
import redis from "@adonisjs/redis/services/main";
import myQueue from "../../queues/queue.js";
import { productsInputValidator } from "#validators/product";

export default class ProductsController {
  /**
   * Get all products with optional filtering and pagination
   */
  async index({ request, response }: HttpContext) {
    // await myQueue.add('send_email', {
    //   recipient: 'foo@mail.com',
    //   subject: 'bar@mail.com',
    //   body: `hello world bar. foo here. the count is: ${count}`,
    // })

    // await myQueue.add('send_email', {
    //   recipient: 'foo@mail.com',
    //   subject: 'bar@mail.com',
    //   body: `second body: ${count}`,
    // })
    //

    try {
      const validatedInput = productsInputValidator.validate(request.input);
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
      // .select('*')

      if (search) {
        query
          .where("name", "ILIKE", `%${search}%`)
          .orWhere("description", "ILIKE", `%${search}%`);
      }

      if (categoryId) {
        query.where("category_id", categoryId);
      }

      query.orderBy(sortBy, sortOrder);

      const cacheKey = `products:${page}:${limit}:${search}:${categoryId}:${sortBy}:${sortOrder}`;
      const cachedProducts = await redis.get(cacheKey);
      if (cachedProducts) {
        return response.ok(JSON.parse(cachedProducts));
      }

      const products = await query.paginate(page, limit);
      await redis.setex(cacheKey, 60, JSON.stringify(products));
      return response.ok(products);
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: "Failed to fetch products",
        error: error.message,
      });
    }
  }

  /**
   * Get a single product by ID
   */
  async show({ params, response }: HttpContext) {
    try {
      const product = await Product.query()
        .where("id", params.id)
        .preload("categories")
        .preload("variations")
        .preload("extras")
        .firstOrFail();

      return response.ok({
        success: true,
        data: product.serialize(),
      });
    } catch (error) {
      return response.notFound({
        success: false,
        message: "Product not found",
      });
    }
  }

  async popular({ request, response }: HttpContext) {
    try {
      const limit = request.input("limit", 10);
    } catch {}
  }

  /**
   * Get products by category ID
   */
  /* async byCategory({ params, request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)
      const sortBy = request.input('sort_by', 'created_at')
      const sortOrder = request.input('sort_order', 'desc')

      const products = await Product.query()
        .where('category_id', params.categoryId)
        .preload('category')
        .orderBy(sortBy, sortOrder)
        .paginate(page, limit)

      return response.ok({
        success: true,
        data: products.serialize(),
        meta: {
          total: products.total,
          page: products.currentPage,
          limit: products.perPage,
          pages: products.lastPage
        }
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Failed to fetch products by category',
        error: error.message
      })
    }
  } */

  /**
   * Get popular products (example: most viewed or best selling)
   */
  /* async popular({ request, response }: HttpContext) {
    try {
      const limit = request.input('limit', 10)

      const products = await Product.query()
        .preload('category')
        .orderBy('views_count', 'desc')
        .orOrderBy('sales_count', 'desc')
        .limit(limit)

      return response.ok({
        success: true,
        data: products.map(product => product.serialize())
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Failed to fetch popular products',
        error: error.message
      })
    }
  } */

  /**
   * Get recommended products (example: random selection for now)
   */
  /* async recommended({ request, response }: HttpContext) {
    try {
      const limit = request.input('limit', 10)

      const products = await Product.query()
        .preload('category')
        .where('is_active', true)
        .orderByRaw('RANDOM()')
        .limit(limit)

      return response.ok({
        success: true,
        data: products.map(product => product.serialize())
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Failed to fetch recommended products',
        error: error.message
      })
    }
  } */
}
