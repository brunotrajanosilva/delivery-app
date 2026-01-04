import { test } from "@japa/runner";
import sinon from "sinon";
import redis from "@adonisjs/redis/services/main";
import Product from "#models/product/product";
import Category from "#models/product/category";
import User from "#models/user/user";

test.group("ProductsController", (group) => {
  let redisStub: sinon.SinonStubbedInstance<typeof redis>;
  let route_url: string;
  let user: User;
  let category: Category;
  let product: Product;
  let product2: Product;

  group.teardown(async () => {
    await User.query().delete();
    await Category.query().delete();
    await Product.query().delete();
    sinon.restore();
  });

  group.setup(async () => {
    user = await User.create({
      email: "test@example2.com",
      password: "password123",
      name: "Test User",
      address: "Test Address",
    });
    route_url = "/api/v1/product";

    category = await Category.create({
      name: "Test Category",
      description: "Test Description",
    });

    product = await Product.create({
      name: "Test Product",
      description: "Regular description",
      price: "99.99",
    });

    product2 = await Product.create({
      name: "Test Product 2",
      description: "Special feature here",
      price: "99.99",
    });

    await product.related("categories").attach([category.id]);
  });

  group.each.setup(async () => {
    redisStub = {
      get: sinon.stub(redis, "get"),
      setex: sinon.stub(redis, "setex"),
    } as any;
  });

  group.each.teardown(async () => {
    sinon.restore();
  });

  test("index - should return paginated products without cache", async ({
    client,
    assert,
  }) => {
    redisStub.get.resolves(null);
    redisStub.setex.resolves("OK");

    const response = await client
      .get(route_url)
      .qs({
        page: 1,
        limit: 10,
      })
      .loginAs(user);

    response.assertStatus(200);
    assert.isTrue(redisStub.get.calledOnce);
    assert.isTrue(redisStub.setex.calledOnce);
    assert.property(response.body(), "data");
    assert.property(response.body(), "meta");
    assert.isArray(response.body().data);
    assert.lengthOf(response.body().data, 2);
    assert.equal(response.body().data[0].name, "Test Product");
  });

  test("index - should return cached products when cache exists", async ({
    client,
    assert,
  }) => {
    const cachedData = {
      data: [
        {
          id: 1,
          name: "Cached Product",
          description: "Cached Description",
          price: 49.99,
        },
      ],
      meta: {
        total: 1,
        perPage: 10,
        currentPage: 1,
        lastPage: 1,
      },
    };

    redisStub.get.resolves(JSON.stringify(cachedData));

    const response = await client
      .get(route_url)
      .qs({
        page: 1,
        limit: 10,
      })
      .loginAs(user);

    response.assertStatus(200);
    assert.isTrue(redisStub.get.calledOnce);
    assert.isFalse(redisStub.setex.called);
    assert.deepEqual(response.body(), cachedData);
  });

  test("index - should filter products by category_id", async ({
    client,
    assert,
  }) => {
    redisStub.get.resolves(null);
    redisStub.setex.resolves("OK");

    const response = await client
      .get(route_url)
      .qs({
        page: 1,
        limit: 10,
        category_id: category.id,
      })
      .loginAs(user);

    response.assertStatus(200);
    assert.lengthOf(response.body().data, 1);
    assert.equal(response.body().data[0].name, "Test Product");
  });

  test("index - should search products by name", async ({ client, assert }) => {
    // Arrange
    await Product.createMany([
      {
        name: "Apple Product",
        description: "Description 1",
        price: "10.0",
      },
      {
        name: "Banana Product",
        description: "Description 2",
        price: "20.0",
      },
    ]);

    redisStub.get.resolves(null);
    redisStub.setex.resolves("OK");

    const response = await client
      .get(route_url)
      .qs({
        page: 1,
        limit: 10,
        search: "Apple",
      })
      .loginAs(user);

    response.assertStatus(200);
    assert.lengthOf(response.body().data, 1);
    assert.equal(response.body().data[0].name, "Apple Product");
  });

  test("index - should search products by description", async ({
    client,
    assert,
  }) => {
    redisStub.get.resolves(null);
    redisStub.setex.resolves("OK");

    const response = await client
      .get(route_url)
      .qs({
        page: 1,
        limit: 10,
        search: "Special",
      })
      .loginAs(user);

    response.assertStatus(200);
    assert.lengthOf(response.body().data, 1);
    assert.equal(response.body().data[0].description, "Special feature here");
  });

  test("index - should sort products by specified field and order", async ({
    client,
    assert,
  }) => {
    redisStub.get.resolves(null);
    redisStub.setex.resolves("OK");

    const response = await client
      .get(route_url)
      .qs({
        page: 1,
        limit: 10,
        sort_by: "name",
        sort_order: "asc",
      })
      .loginAs(user);

    response.assertStatus(200);
    assert.equal(response.body().data[0].name, "Apple Product");
    assert.equal(response.body().data[1].name, "Banana Product");
    assert.equal(response.body().data[2].name, "Test Product");
  });

  test("index - should use correct cache key with all parameters", async ({
    client,
    assert,
  }) => {
    redisStub.get.resolves(null);
    redisStub.setex.resolves("OK");

    await client
      .get(route_url)
      .qs({
        page: 2,
        limit: 5,
        search: "test",
        category_id: 123,
        sort_by: "price",
        sort_order: "asc",
      })
      .loginAs(user);

    // Assert
    const expectedCacheKey = "products:2:5:test:123:price:asc";
    assert.isTrue(redisStub.get.calledWith(expectedCacheKey));
    assert.isTrue(
      redisStub.setex.calledWith(expectedCacheKey, 3600, sinon.match.string),
    );
  });

  test("show - should return single product without cache", async ({
    client,
    assert,
  }) => {
    redisStub.get.resolves(null);
    redisStub.setex.resolves("OK");

    const response = await client
      .get(route_url + "/" + product.id)
      .loginAs(user);

    response.assertStatus(200);
    assert.isTrue(redisStub.get.calledOnce);
    assert.isTrue(redisStub.setex.calledOnce);
    assert.equal(response.body().name, "Test Product");
    assert.equal(response.body().id, product.id);
  });

  test("show - should return cached product when cache exists", async ({
    client,
    assert,
  }) => {
    const cachedProduct = {
      id: 111,
      name: "Cached Product",
      description: "Cached Description",
      price: 49.99,
    };

    redisStub.get.resolves(JSON.stringify(cachedProduct));

    const response = await client.get(route_url + "/111").loginAs(user);

    response.assertStatus(200);
    assert.isTrue(redisStub.get.calledOnce);
    assert.isFalse(redisStub.setex.called);
    assert.deepEqual(response.body(), cachedProduct);
  });

  test("show - should return 404 when product not found", async ({
    client,
    assert,
  }) => {
    redisStub.get.resolves(null);

    const response = await client.get(route_url + "/999999").loginAs(user);

    response.assertStatus(404);
    assert.property(response.body(), "success");
    assert.property(response.body(), "message");
    assert.equal(response.body().success, false);
    assert.equal(response.body().message, "Product not found");
  });

  test("show - should use correct cache key", async ({ client, assert }) => {
    redisStub.get.resolves(null);
    redisStub.setex.resolves("OK");

    await client.get(route_url + "/" + product.id).loginAs(user);

    const expectedCacheKey = `product:${product.id}`;
    assert.isTrue(redisStub.get.calledWith(expectedCacheKey));
    assert.isTrue(
      redisStub.setex.calledWith(expectedCacheKey, 3600, sinon.match.string),
    );
  });

  test("show - should validate id parameter", async ({ client }) => {
    const response = await client.get(route_url + "/invalid-id").loginAs(user);
    response.assertStatus(422);
  });

  test("index - should preload relationships", async ({ client, assert }) => {
    redisStub.get.resolves(null);
    redisStub.setex.resolves("OK");

    const response = await client.get(route_url).loginAs(user);

    response.assertStatus(200);
    assert.property(response.body().data[0], "categories");
    assert.property(response.body().data[0], "variations");
    assert.property(response.body().data[0], "extras");
  });
});
