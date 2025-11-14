import { test } from "@japa/runner";
import sinon from "sinon";
import OrderController from "#controllers/user/order_controller";
import Order from "#models/user/order";
import { orderStoreValidator } from "#validators/order";
import { itemIdValidator } from "#validators/itemId";
import type { HttpContext } from "@adonisjs/core/http";
import type { Queue, Job } from "bullmq";

test.group("OrderController", (group) => {
  let controller: OrderController;
  let queueMock: sinon.SinonStubbedInstance<Queue>;
  let ctx: Partial<HttpContext>;

  group.each.setup(() => {
    // Create Queue mock
    queueMock = {
      add: sinon.stub(),
    } as any;

    // Instantiate controller with mocked queue
    controller = new OrderController(queueMock as Queue);

    // Setup basic HttpContext mock
    ctx = {
      request: {
        validateUsing: sinon.stub(),
        all: sinon.stub(),
        input: sinon.stub(),
      } as any,
      response: {
        ok: sinon.stub().returnsThis(),
        internalServerError: sinon.stub().returnsThis(),
        notFound: sinon.stub().returnsThis(),
      } as any,
      auth: {
        user: {
          id: 1,
          email: "test@example.com",
        },
      } as any,
      params: {},
    };
  });

  group.each.teardown(() => {
    sinon.restore();
  });

  test("store - should create order job and return job id", async ({
    assert,
  }) => {
    // Arrange
    const requestData = {
      items: [{ productId: 1, quantity: 2 }],
      total: 100,
    };
    const jobMock = { id: "job-123" } as Job;

    ctx.request!.input = sinon.stub();
    ctx.request!.input.withArgs("couponCode").returns(null);
    ctx.request!.input.withArgs("paymentGateway").returns("stripe");
    ctx.request!.input.withArgs("cartItemIds").returns([1, 2]);
    ctx.request!.all = sinon.stub().returns(requestData);
    ctx.request!.validateUsing = sinon.stub().resolves();
    queueMock.add.resolves(jobMock);
    // Act
    await controller.store(ctx as HttpContext);

    // Assert
    assert.isTrue(ctx.request!.validateUsing.calledWith(orderStoreValidator));
    assert.isTrue(
      queueMock.add.calledWith("order-creation", {
        userId: 1,
        couponCode: null,
        paymentGateway: "stripe",
        cartItemIds: [1, 2],
      }),
    );
    assert.isTrue(
      ctx.response!.ok.calledWith({
        message: "We are processing your order",
        jobId: "job-123",
      }),
    );
  });

  test("store - should handle queue errors", async ({ assert }) => {
    // Arrange
    const queueError = new Error("Queue is unavailable");
    ctx.request!.validateUsing = sinon.stub().resolves();
    ctx.request!.all = sinon.stub().returns({});
    queueMock.add.rejects(queueError);

    // Act
    await controller.store(ctx as HttpContext);

    // Assert
    assert.isTrue(
      ctx.response!.internalServerError.calledWith({
        success: false,
        message: "Failed to create order",
        error: "Queue is unavailable",
      }),
    );
  });

  test("index - should return paginated orders", async ({ assert }) => {
    // Arrange
    const orderQueryMock = {
      where: sinon.stub().returnsThis(),
      preload: sinon.stub().returnsThis(),
      orderBy: sinon.stub().returnsThis(),
      paginate: sinon.stub().resolves({
        data: [{ id: 1, total: 100 }],
        meta: { total: 1, perPage: 10, currentPage: 1 },
      }),
    };

    sinon.stub(Order, "query").returns(orderQueryMock as any);
    ctx.request!.input = sinon.stub();
    ctx.request!.input.withArgs("page", 1).returns(1);
    ctx.request!.input.withArgs("perPage", 10).returns(10);

    // Act
    await controller.index(ctx as HttpContext);

    // Assert
    assert.isTrue(orderQueryMock.where.calledWith(" user_id", 1));
    assert.isTrue(orderQueryMock.preload.calledWith("items"));
    assert.isTrue(orderQueryMock.orderBy.calledWith("created_at", "desc"));
    assert.isTrue(orderQueryMock.paginate.calledWith(1, 10));
    assert.isTrue(
      ctx.response!.ok.calledWith({
        success: true,
        data: [{ id: 1, total: 100 }],
        meta: { total: 1, perPage: 10, currentPage: 1 },
      }),
    );
  });

  test("index - should handle custom pagination params", async ({ assert }) => {
    // Arrange
    const orderQueryMock = {
      where: sinon.stub().returnsThis(),
      preload: sinon.stub().returnsThis(),
      orderBy: sinon.stub().returnsThis(),
      paginate: sinon.stub().resolves({ data: [], meta: {} }),
    };

    sinon.stub(Order, "query").returns(orderQueryMock as any);
    ctx.request!.input = sinon.stub();
    ctx.request!.input.withArgs("page", 1).returns(2);
    ctx.request!.input.withArgs("perPage", 10).returns(20);

    // Act
    await controller.index(ctx as HttpContext);

    // Assert
    assert.isTrue(orderQueryMock.paginate.calledWith(2, 20));
  });

  test("index - should handle database errors", async ({ assert }) => {
    // Arrange
    const dbError = new Error("Database connection failed");
    const orderQueryMock = {
      where: sinon.stub().returnsThis(),
      preload: sinon.stub().returnsThis(),
      orderBy: sinon.stub().returnsThis(),
      paginate: sinon.stub().rejects(dbError),
    };

    sinon.stub(Order, "query").returns(orderQueryMock as any);
    ctx.request!.input = sinon.stub().returns(1);

    // Act
    await controller.index(ctx as HttpContext);

    // Assert
    assert.isTrue(
      ctx.response!.internalServerError.calledWith({
        success: false,
        message: "Failed to retrieve orders",
        error: "Database connection failed",
      }),
    );
  });

  test("show - should return order by id", async ({ assert }) => {
    // Arrange
    const orderMock = {
      id: 1,
      total: 100,
      items: [{ id: 1, name: "Product 1" }],
    };
    const orderQueryMock = {
      where: sinon.stub().returnsThis(),
      preload: sinon.stub().returnsThis(),
      firstOrFail: sinon.stub().resolves(orderMock),
    };

    ctx.params = { id: "1" };
    sinon.stub(itemIdValidator, "validate").resolves();
    sinon.stub(Order, "query").returns(orderQueryMock as any);

    // Act
    await controller.show(ctx as HttpContext);

    // Assert
    assert.isTrue(itemIdValidator.validate.calledWith({ id: "1" }));
    assert.isTrue(orderQueryMock.where.calledWith("id", "1"));
    assert.isTrue(orderQueryMock.preload.calledWith("items"));
    assert.isTrue(ctx.response!.ok.calledWith(orderMock));
  });

  test("show - should return 404 when order not found", async ({ assert }) => {
    // Arrange
    const orderQueryMock = {
      where: sinon.stub().returnsThis(),
      preload: sinon.stub().returnsThis(),
      firstOrFail: sinon.stub().rejects(new Error("Row not found")),
    };

    ctx.params = { id: "999" };
    sinon.stub(itemIdValidator, "validate").resolves();
    sinon.stub(Order, "query").returns(orderQueryMock as any);

    // Act
    await controller.show(ctx as HttpContext);

    // Assert
    assert.isTrue(
      ctx.response!.notFound.calledWith({
        success: false,
        message: "Product not found",
        error: "Row not found",
      }),
    );
  });

  test("show - should handle validation errors", async ({ assert }) => {
    // Arrange
    ctx.params = { id: "invalid" };
    sinon.stub(itemIdValidator, "validate").rejects(new Error("Invalid ID"));

    // Act & Assert
    try {
      await controller.show(ctx as HttpContext);
      assert.fail("Should have thrown validation error");
    } catch (error) {
      assert.equal(error.message, "Invalid ID");
    }
  });
});
