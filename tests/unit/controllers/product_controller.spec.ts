import { test } from "@japa/runner";
import sinon from "sinon";
import ProductsController from "#controllers/product/product_controller";
import Product from "#models/product/product";
import redis from "@adonisjs/redis/services/main";
import { itemIdValidator } from "#validators/itemId";

test.group("ProductsController", (group) => {
  let sandbox: sinon.SinonSandbox;

  group.each.setup(() => {
    sandbox = sinon.createSandbox();
  });

  group.each.teardown(() => {
    sandbox.restore();
  });

  test("index - should return cached products if available", async ({
    assert,
  }) => {
    const controller = new ProductsController();
    const cachedData = {
      data: [{ id: 1, name: "Product 1" }],
      meta: { total: 1, per_page: 10, current_page: 1 },
    };

    const mockRequest = {
      validateUsing: sandbox.stub().resolves(),
      input: sandbox.stub(),
    };
    mockRequest.input.withArgs("page", 1).returns(1);
    mockRequest.input.withArgs("limit", 10).returns(10);
    mockRequest.input.withArgs("search", null).returns(null);
    mockRequest.input.withArgs("category_id", null).returns(null);
    mockRequest.input.withArgs("sort_by", "created_at").returns("created_at");
    mockRequest.input.withArgs("sort_order", "desc").returns("desc");

    const mockResponse = {
      ok: sandbox.stub().returnsThis(),
    };

    const redisGetStub = sandbox
      .stub(redis, "get")
      .resolves(JSON.stringify(cachedData));

    const ctx = { request: mockRequest, response: mockResponse } as any;

    await controller.index(ctx);

    assert.isTrue(mockRequest.validateUsing.calledOnce);
    assert.isTrue(redisGetStub.calledOnce);
    assert.isTrue(mockResponse.ok.calledWith(cachedData));
  });

  test("index - should fetch and cache products if not in cache", async ({
    assert,
  }) => {
    const controller = new ProductsController();
    const productsData = {
      data: [{ id: 1, name: "Product 1" }],
      meta: { total: 1, per_page: 10, current_page: 1 },
    };

    const mockQuery = {
      preload: sandbox.stub().returnsThis(),
      where: sandbox.stub().returnsThis(),
      orWhere: sandbox.stub().returnsThis(),
      orderBy: sandbox.stub().returnsThis(),
      paginate: sandbox.stub().resolves(productsData),
    };

    const mockRequest = {
      validateUsing: sandbox.stub().resolves(),
      input: sandbox.stub(),
    };
    mockRequest.input.withArgs("page", 1).returns(1);
    mockRequest.input.withArgs("limit", 10).returns(10);
    mockRequest.input.withArgs("search", null).returns(null);
    mockRequest.input.withArgs("category_id", null).returns(null);
    mockRequest.input.withArgs("sort_by", "created_at").returns("created_at");
    mockRequest.input.withArgs("sort_order", "desc").returns("desc");

    const mockResponse = {
      ok: sandbox.stub().returnsThis(),
    };

    sandbox.stub(Product, "query").returns(mockQuery as any);
    const redisGetStub = sandbox.stub(redis, "get").resolves(null);
    const redisSetexStub = sandbox.stub(redis, "setex").resolves("OK");

    const ctx = { request: mockRequest, response: mockResponse } as any;

    await controller.index(ctx);

    assert.isTrue(redisGetStub.calledOnce);
    assert.isTrue(redisSetexStub.calledOnce);
    assert.isTrue(mockResponse.ok.calledWith(productsData));
    assert.isTrue(mockQuery.preload.calledThrice);
    assert.isTrue(mockQuery.orderBy.calledOnce);
  });

  test("index - should filter by category_id when provided", async ({
    assert,
  }) => {
    const controller = new ProductsController();
    const productsData = { data: [], meta: {} };

    const mockQuery = {
      preload: sandbox.stub().returnsThis(),
      where: sandbox.stub().returnsThis(),
      orderBy: sandbox.stub().returnsThis(),
      paginate: sandbox.stub().resolves(productsData),
    };

    const mockRequest = {
      validateUsing: sandbox.stub().resolves(),
      input: sandbox.stub(),
    };
    mockRequest.input.withArgs("page", 1).returns(1);
    mockRequest.input.withArgs("limit", 10).returns(10);
    mockRequest.input.withArgs("search", null).returns(null);
    mockRequest.input.withArgs("category_id", null).returns(5);
    mockRequest.input.withArgs("sort_by", "created_at").returns("created_at");
    mockRequest.input.withArgs("sort_order", "desc").returns("desc");

    const mockResponse = {
      ok: sandbox.stub().returnsThis(),
    };

    sandbox.stub(Product, "query").returns(mockQuery as any);
    sandbox.stub(redis, "get").resolves(null);
    sandbox.stub(redis, "setex").resolves("OK");

    const ctx = { request: mockRequest, response: mockResponse } as any;

    await controller.index(ctx);

    assert.isTrue(mockQuery.where.calledWith("category_id", 5));
  });

  test("index - should filter by search term when provided", async ({
    assert,
  }) => {
    const controller = new ProductsController();
    const productsData = { data: [], meta: {} };

    const mockQuery = {
      preload: sandbox.stub().returnsThis(),
      where: sandbox.stub().returnsThis(),
      orWhere: sandbox.stub().returnsThis(),
      orderBy: sandbox.stub().returnsThis(),
      paginate: sandbox.stub().resolves(productsData),
    };

    const mockRequest = {
      validateUsing: sandbox.stub().resolves(),
      input: sandbox.stub(),
    };
    mockRequest.input.withArgs("page", 1).returns(1);
    mockRequest.input.withArgs("limit", 10).returns(10);
    mockRequest.input.withArgs("search", null).returns("test");
    mockRequest.input.withArgs("category_id", null).returns(null);
    mockRequest.input.withArgs("sort_by", "created_at").returns("created_at");
    mockRequest.input.withArgs("sort_order", "desc").returns("desc");

    const mockResponse = {
      ok: sandbox.stub().returnsThis(),
    };

    sandbox.stub(Product, "query").returns(mockQuery as any);
    sandbox.stub(redis, "get").resolves(null);
    sandbox.stub(redis, "setex").resolves("OK");

    const ctx = { request: mockRequest, response: mockResponse } as any;

    await controller.index(ctx);

    assert.isTrue(mockQuery.where.calledWith("name", "ILIKE", "%test%"));
    assert.isTrue(
      mockQuery.orWhere.calledWith("description", "ILIKE", "%test%"),
    );
  });

  test("index - should return 500 on error", async ({ assert }) => {
    const controller = new ProductsController();
    const errorMessage = "Database error";

    const mockRequest = {
      validateUsing: sandbox.stub().resolves(),
      input: sandbox.stub().returns(1),
    };

    const mockResponse = {
      internalServerError: sandbox.stub().returnsThis(),
    };

    sandbox.stub(Product, "query").throws(new Error(errorMessage));

    const ctx = { request: mockRequest, response: mockResponse } as any;

    await controller.index(ctx);

    assert.isTrue(mockResponse.internalServerError.calledOnce);
    assert.isTrue(
      mockResponse.internalServerError.calledWith({
        success: false,
        message: "Failed to fetch products",
        error: errorMessage,
      }),
    );
  });

  test("show - should return cached product if available", async ({
    assert,
  }) => {
    const controller = new ProductsController();
    const productData = { id: 1, name: "Product 1" };

    const mockParams = { id: 1 };
    const mockResponse = {
      ok: sandbox.stub().returnsThis(),
    };

    sandbox.stub(itemIdValidator, "validate").resolves();
    const redisGetStub = sandbox
      .stub(redis, "get")
      .resolves(JSON.stringify(productData));

    const mockQuery = {
      where: sandbox.stub().returnsThis(),
      preload: sandbox.stub().returnsThis(),
      firstOrFail: sandbox.stub().resolves(productData),
    };
    sandbox.stub(Product, "query").returns(mockQuery as any);

    const ctx = { params: mockParams, response: mockResponse } as any;

    await controller.show(ctx);

    assert.isTrue(redisGetStub.calledWith("product:1"));
    assert.isTrue(mockResponse.ok.calledWith(productData));
  });

  test("show - should fetch and cache product if not in cache", async ({
    assert,
  }) => {
    const controller = new ProductsController();
    const productData = { id: 1, name: "Product 1" };

    const mockParams = { id: 1 };
    const mockResponse = {
      ok: sandbox.stub().returnsThis(),
    };

    sandbox.stub(itemIdValidator, "validate").resolves();
    const redisGetStub = sandbox.stub(redis, "get").resolves(null);
    const redisSetexStub = sandbox.stub(redis, "setex").resolves("OK");

    const mockQuery = {
      where: sandbox.stub().returnsThis(),
      preload: sandbox.stub().returnsThis(),
      firstOrFail: sandbox.stub().resolves(productData),
    };
    sandbox.stub(Product, "query").returns(mockQuery as any);

    const ctx = { params: mockParams, response: mockResponse } as any;

    await controller.show(ctx);

    assert.isTrue(redisGetStub.calledOnce);
    assert.isTrue(
      redisSetexStub.calledWith("product:1", 3600, JSON.stringify(productData)),
    );
    assert.isTrue(mockResponse.ok.calledWith(productData));
    assert.isTrue(mockQuery.preload.calledThrice);
  });

  test("show - should return 404 when product not found", async ({
    assert,
  }) => {
    const controller = new ProductsController();

    const mockParams = { id: 999 };
    const mockResponse = {
      notFound: sandbox.stub().returnsThis(),
    };

    sandbox.stub(itemIdValidator, "validate").resolves();

    const mockQuery = {
      where: sandbox.stub().returnsThis(),
      preload: sandbox.stub().returnsThis(),
      firstOrFail: sandbox.stub().rejects(new Error("Product not found")),
    };
    sandbox.stub(Product, "query").returns(mockQuery as any);

    const ctx = { params: mockParams, response: mockResponse } as any;

    await controller.show(ctx);

    assert.isTrue(mockResponse.notFound.calledOnce);
    assert.isTrue(
      mockResponse.notFound.calledWith({
        success: false,
        message: "Product not found",
      }),
    );
  });
});
