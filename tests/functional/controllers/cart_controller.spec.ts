import { test } from "@japa/runner";
import User from "#models/user/user";
import CartItem from "#models/user/cart_item";
import Product from "#models/product/product";
import Variation from "#models/product/variation";
import Extra from "#models/product/extra";
import Ingredient from "#models/stock/ingredient";

test.group("Cart Controller", (group) => {
  let user: User;
  let variation: Variation;
  let product: Product;

  group.setup(async () => {
    user = await User.create({
      email: "test@example2.com",
      password: "password123",
      name: "Test User",
      address: "Test Address",
    });

    product = await Product.create({
      name: "Test Product",
      price: "10.00",
      description: "This is a test product",
    });

    variation = await Variation.create({
      name: "Test Variation",
      price: "1",
      isRecipe: false,
      productId: product.id,
    });

    await Ingredient.createMany([
      { name: "Ingredient 1", unit: "grams" },
      { name: "Ingredient 2", unit: "grams" },
    ]);

    await Extra.createMany([
      {
        name: "Extra 1",
        price: "2.00",
        quantity: 350,
        productId: product.id,
        ingredientId: 1,
      },
      {
        name: "Extra 2",
        price: "3.00",
        quantity: 200,
        productId: product.id,
        ingredientId: 2,
      },
    ]);
  });

  group.each.teardown(async () => {
    await CartItem.query().where("userId", user.id).delete();
  });

  group.teardown(async () => {
    await User.query().delete();
    await Product.query().delete();
    await Variation.query().delete();
  });

  test("GET /cart - should retrieve user cart", async ({ client, assert }) => {
    const response = await client.get("/api/v1/cart").loginAs(user);

    response.assertStatus(200);
    response.assertBody({
      success: true,
      data: { items: [], totalPrice: "0" },
    });
  });

  test("POST /cart - should add item to cart", async ({ client, assert }) => {
    const response = await client
      .post("/api/v1/cart")
      .json({
        variationId: variation.id,
        quantity: 2,
        cartItemExtras: [
          { extraId: 1, quantity: 1 },
          { extraId: 2, quantity: 2 },
        ],
      })
      .loginAs(user);
    response.assertStatus(200);
    response.assertBody({
      success: true,
    });
  });

  test("POST /cart - should fail without authentication", async ({
    client,
    assert,
  }) => {
    const response = await client.post("/api/v1/cart").json({
      variationId: 1,
      quantity: 1,
    });

    response.assertStatus(401);
  });

  test("PATCH /cart - should update cart item", async ({ client, assert }) => {
    const cartItem = await CartItem.create({
      userId: user.id,
      variationId: 1,
      quantity: 1,
    });

    const response = await client
      .patch("/api/v1/cart/" + cartItem.id)
      .json({
        quantity: 3,
        cartItemExtras: [],
      })
      .loginAs(user);

    response.assertStatus(200);
    response.assertBody({
      success: true,
    });
  });

  test("PATCH /cart - should update cart item with extras", async ({
    client,
    assert,
  }) => {
    const cartItem = await CartItem.create({
      userId: user.id,
      variationId: 1,
      quantity: 1,
    });

    const response = await client
      .patch("/api/v1/cart/" + cartItem.id)
      .json({
        quantity: 3,
        cartItemExtras: [
          { extraId: 1, quantity: 1 },
          { extraId: 2, quantity: 2 },
        ],
      })
      .loginAs(user);

    response.assertStatus(200);
    response.assertBody({
      success: true,
    });
  });
  test("PATCH /cart - should fail with invalid data", async ({
    client,
    assert,
  }) => {
    const cartItem = await CartItem.create({
      userId: user.id,
      variationId: 1,
      quantity: 1,
    });

    const response = await client
      .patch("/api/v1/cart/" + cartItem.id)
      .json({
        cartItemExtras: [],
      })
      .loginAs(user);

    response.assertStatus(422);
  });

  test("POST /cart/checkout - should process checkout", async ({
    client,
    assert,
  }) => {
    const cartItem = await CartItem.create({
      userId: user.id,
      variationId: 1,
      quantity: 2,
    });

    const response = await client
      .get("/api/v1/cart/checkout")
      .qs({
        cartItemIds: [cartItem.id, 2],
        couponCode: "DISCOUNT10",
      })
      .loginAs(user);

    // console.log(response.error().text);

    response.assertStatus(201);
    response.assertBodyContains({
      success: true,
      message: "Checkout successful",
    });
  });

  test("POST /cart/checkout - should process checkout without coupon", async ({
    client,
    assert,
  }) => {
    const cartItem = await CartItem.create({
      userId: user.id,
      variationId: 1,
      quantity: 1,
    });

    const response = await client
      .get("/api/v1/cart/checkout")
      .qs({
        cartItemIds: [cartItem.id, 2],
        couponCode: "DISCOUNT10",
      })
      .loginAs(user);

    response.assertStatus(201);
    response.assertBodyContains({
      success: true,
      message: "Checkout successful",
    });
  });

  test("POST /cart/checkout - should fail without authentication", async ({
    client,
    assert,
  }) => {
    const response = await client.get("api/v1/cart/checkout").json({
      cartItemIds: [1, 2],
    });

    response.assertStatus(401);
  });
});
