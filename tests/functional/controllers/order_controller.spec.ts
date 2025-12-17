import { test } from "@japa/runner";
import sinon from "sinon";
// import { UserFactory } from "#factories/user_factory";
// import { CartItemFactory } from "#factories/cart_item_factory";
import User from "#models/user/user";
import CartItem from "#models/user/cart_item";
import Order from "#models/user/order";
import { Queue } from "bullmq";
import app from "@adonisjs/core/services/app";
import { v4 as uuidv4 } from "uuid";
import { error } from "console";

test.group("Order Controller", (group) => {
  let user: User;
  let authToken: string;
  let mockQueue: sinon.SinonStubbedInstance<Queue>;
  let route_url: string;
  let polling_url: string;

  group.setup(async () => {
    route_url = "/api/v1/order";

    user = await User.create({
      email: "test@example2.com",
      password: "password123",
      name: "Test User",
      address: "Test Address",
    });

    mockQueue = sinon.createStubInstance(Queue);
    app.container.singleton(Queue, () => mockQueue);
  });

  group.teardown(async () => {});

  group.each.setup(async () => {
    await Order.query().delete();
  });

  test("should create an order and return job id", async ({
    client,
    assert,
  }) => {
    const cartItemIds = [1, 2, 3, 4];
    mockQueue.add.resolves({ id: "test-job-id-123" } as any);
    const idempotencyKey = uuidv4();

    const response = await client
      .post(route_url)
      .header("X-Idempotency-Key", idempotencyKey)
      .json({
        couponCode: "DISCOUNT10",
        paymentGateway: "stripe",
        cartItemIds: cartItemIds,
      })
      .loginAs(user);

    response.assertStatus(200);
    response.assertBodyContains({
      message: "We are processing your order",
      jobId: "test-job-id-123",
    });

    assert.isTrue(
      mockQueue.add.calledOnceWithExactly(
        "order-creation",
        {
          userId: user.id,
          couponCode: "DISCOUNT10",
          paymentGateway: "stripe",
          cartItemIds: cartItemIds,
        },
        {
          jobId: idempotencyKey,
        },
      ),
    );
  });

  test("should fail without idempotency key", async ({ client }) => {
    const response = await client
      .post(route_url)
      .json({
        couponCode: "DISCOUNT10",
        paymentGateway: "stripe",
        cartItemIds: [1, 2],
      })
      .loginAs(user);

    response.assertStatus(422);
  });

  test("should fail without authentication", async ({ client }) => {
    const response = await client
      .post(route_url)
      .header("X-Idempotency-Key", "test-key")
      .json({
        couponCode: "DISCOUNT10",
        paymentGateway: "stripe",
        cartItemIds: [1, 2],
      });

    response.assertStatus(401);
  });

  test("should retrieve paginated orders for authenticated user", async ({
    client,
    assert,
  }) => {
    await Order.createMany([
      {
        userId: user.id,
        paymentGateway: "stripe",
        paymentStatus: "paid",
        paymentId: "id_342009e",
        uuid: "test-uuid-123",
        totalPrice: "100.00",
        totalToPay: "100.00",
      },
      {
        userId: user.id,
        paymentGateway: "stripe",
        paymentStatus: "paid",
        paymentId: "id_342009e",
        uuid: "test-uuid-153",
        totalPrice: "130.00",
        totalToPay: "130.00",
      },
      {
        userId: user.id,
        paymentGateway: "stripe",
        paymentStatus: "paid",
        paymentId: "id_342009e",
        uuid: "test-uuid-153",
        totalPrice: "180.00",
        totalToPay: "180.00",
      },
    ]);

    const response = await client.get(route_url).loginAs(user);

    response.assertStatus(200);
    response.assertBodyContains({
      success: true,
      totalNumber: 3,
    });
  });

  test("should retrieve orders with pagination parameters", async ({
    client,
    assert,
  }) => {
    await Order.createMany([
      {
        userId: user.id,
        paymentGateway: "stripe",
        paymentStatus: "paid",
        paymentId: "id_342009e",
        uuid: "test-uuid-123",
        totalPrice: "100.00",
        totalToPay: "100.00",
      },
      {
        userId: user.id,
        paymentGateway: "stripe",
        paymentStatus: "paid",
        paymentId: "id_342009e",
        uuid: "test-uuid-153",
        totalPrice: "130.00",
        totalToPay: "130.00",
      },
      {
        userId: user.id,
        paymentGateway: "stripe",
        paymentStatus: "paid",
        paymentId: "id_342009e",
        uuid: "test-uuid-153",
        totalPrice: "180.00",
        totalToPay: "180.00",
      },
    ]);
    const response = await client
      .get(route_url)
      .qs({ page: 1, perPage: 2 })
      .loginAs(user);

    response.assertStatus(200);
    response.assertBodyContains({
      success: true,
      totalNumber: 3,
    });
  });

  test("should show a specific order", async ({ client, assert }) => {
    const order = await Order.create({
      userId: user.id,
      paymentGateway: "stripe",
      paymentStatus: "paid",
      paymentId: "id_342009e",
      uuid: "test-uuid-153",
      totalPrice: "180.00",
      totalToPay: "180.00",
    });

    const response = await client.get(route_url + "/" + order.id).loginAs(user);

    response.assertStatus(200);
    assert.equal(response.body().id, order.id);
  });

  test("should return 404 for non-existent order", async ({ client }) => {
    const response = await client.get(route_url + "/99999").loginAs(user);

    response.assertStatus(404);
    response.assertBodyContains({
      success: false,
      message: "Product not found",
    });
  });

  test("should fail to show order with invalid id", async ({ client }) => {
    const response = await client.get(route_url + "/invalid-id").loginAs(user);

    response.assertStatus(422);
  });

  test("should retrieve order status by job id", async ({ client, assert }) => {
    mockQueue.getJob.resolves({
      getStatus: sinon.stub().returns("pending"),
    });
    const jobId = uuidv4();

    const response = await client
      .get("/api/v1/polling/check-order-status/" + jobId)
      .loginAs(user);

    response.assertStatus(200);
    response.assertBody({
      status: "pending",
    });
  });

  test("should include orderId when job is completed", async ({
    client,
    assert,
  }) => {
    mockQueue.getJob.resolves({
      getStatus: sinon.stub().returns("completed"),
      returnvalue: 12,
    });
    const jobId = uuidv4();

    const response = await client
      .get("/api/v1/polling/check-order-status/" + jobId)
      .loginAs(user);

    response.assertStatus(200);
    response.assertBody({
      status: "completed",
      orderId: 12,
    });
  });

  test("should return 404 for non-existent job id", async ({ client }) => {
    mockQueue.getJob.throws({ message: "Job not found" });
    const jobId = uuidv4();

    const response = await client
      .get("/api/v1/polling/check-order-status/" + jobId)
      .loginAs(user);

    response.assertStatus(404);
    response.assertBodyContains({
      success: false,
      message: "failed to retrieve order status",
      error: "Job not found",
    });
  });
});
