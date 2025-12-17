import type { HttpContext } from "@adonisjs/core/http";
import Order from "#models/user/order";

import { orderStoreValidator } from "#validators/order";

import { Queue } from "bullmq";
import { inject } from "@adonisjs/core";
import { itemIdValidator } from "#validators/itemId";
import { idempotencyKeyValidator } from "#validators/idempotency_key";

@inject()
export default class OrderController {
  constructor(private queueOrder: Queue) {}

  async store({ auth, request, response }: HttpContext) {
    await request.validateUsing(orderStoreValidator);
    await idempotencyKeyValidator.validate({
      idempotencyKey: request.header("X-Idempotency-Key"),
    });

    try {
      const user = auth.user!;
      const couponCode = request.input("couponCode");
      const paymentGateway = request.input("paymentGateway");
      const cartItemIds = request.input("cartItemIds");

      const idempotencyKey = request.header("X-Idempotency-Key");

      const jobData = {
        userId: user.id,
        couponCode,
        paymentGateway,
        cartItemIds,
      };

      const job = await this.queueOrder.add("order-creation", jobData, {
        jobId: idempotencyKey,
      });
      //polling: uses the job id to check if the job is completed
      return response.ok({
        message: "We are processing your order",
        jobId: job.id,
      });
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: "Failed to create order",
        error: error.message,
      });
    }
  }
  async index({ auth, request, response }: HttpContext) {
    //add validation
    try {
      const page = request.input("page", 1);
      const perPage = request.input("perPage", 10);
      const user = auth.user;

      const query = Order.query()
        .where(" user_id", user!.id)
        .preload("items")
        .orderBy("created_at", "desc");

      const orders = await query.paginate(page, perPage);

      return response.ok({
        success: true,
        ...orders,
      });
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: "Failed to retrieve orders",
        error: error.message,
      });
    }
  }
  async show({ params, response }: HttpContext) {
    await itemIdValidator.validate({ id: params.id });
    try {
      const order = await Order.query()
        .where("id", params.id)
        .preload("items")
        .firstOrFail();

      return response.ok(order);
    } catch (error) {
      return response.notFound({
        success: false,
        message: "Product not found",
        error: error.message,
      });
    }
  }

  async orderStatus({ params, response }: HttpContext) {
    await idempotencyKeyValidator.validate({
      idempotencyKey: params.jobId,
    });

    try {
      const orderJob = await this.queueOrder.getJob(params.jobId);
      if (!orderJob) throw new Error("Order job not found");

      const orderStatus = orderJob.getStatus();
      const result: { status: string; orderId?: number } = {
        status: orderStatus,
      };
      if (orderStatus === "completed") {
        result.orderId = orderJob.returnvalue;
      }

      return response.ok(result);
    } catch (error) {
      return response.notFound({
        success: false,
        message: "failed to retrieve order status",
        error: error.message,
      });
    }
  }
}
