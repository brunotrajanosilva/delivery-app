import { test } from "@japa/runner";
import sinon from "sinon";
import CartItem from "#models/user/cart_item";
import CartItemExtra from "#models/user/cart_item_extra";
import Variation from "#models/product/variation";

test.group("CartItem Model", (group) => {
  let sandbox: sinon.SinonSandbox;

  group.each.setup(() => {
    sandbox = sinon.createSandbox();
  });

  group.each.teardown(() => {
    sandbox.restore();
  });

  test("getCartItemsByUserId - should return cart items with preloaded relations", async ({
    assert,
  }) => {
    const options = { userId: 1 };
    const mockCartItems = [
      {
        id: 1,
        userId: options.userId,
        quantity: 2,
        variationId: 10,
        variation: {
          id: 10,
          price: 1.5,
          product: { id: 5, name: "Product 1", price: 10 },
        },
        cartItemExtras: [],
      },
    ];

    const queryStub = {
      where: sandbox.stub().returnsThis(),
      preload: sandbox.stub().returnsThis(),
      exec: sandbox.stub().resolves(mockCartItems),
    };

    sandbox.stub(CartItem, "query").returns(queryStub as any);

    const result = await CartItem.getCartItems(options);

    assert.equal(result, mockCartItems);
    assert.isTrue(queryStub.where.calledWith("userId", options.userId));
    assert.equal(queryStub.preload.callCount, 2);
  });

  test("getCartItemsByUserId - should throw error when cart items not found", async ({
    assert,
  }) => {
    const queryStub = {
      where: sandbox.stub().returnsThis(),
      preload: sandbox.stub().returnsThis(),
      exec: sandbox.stub().resolves(null),
    };

    sandbox.stub(CartItem, "query").returns(queryStub as any);

    await assert.rejects(
      () => CartItem.getCartItems({ userId: 1 }),
      "Cart items not found",
    );
  });

  test("getCartItemsFiltered - should return filtered cart items", async ({
    assert,
  }) => {
    const options = { userId: 1, cartItemIds: [1, 2, 3] };
    const mockCartItems = [
      {
        id: 1,
        userId: 1,
        quantity: 2,
        variationId: 10,
        variation: {
          id: 10,
          price: 1.5,
          product: { id: 5, name: "Product 1", price: 10 },
          recipe: { id: 1, name: "Recipe 1" },
        },
        cartItemExtras: [],
      },
    ];

    const queryStub = {
      where: sandbox.stub().returnsThis(),
      whereIn: sandbox.stub().returnsThis(),
      preload: sandbox.stub().returnsThis(),
      exec: sandbox.stub().resolves(mockCartItems),
    };

    sandbox.stub(CartItem, "query").returns(queryStub as any);

    const result = await CartItem.getCartItems(options);

    assert.equal(result, mockCartItems);
    assert.isTrue(queryStub.where.calledWith("userId", options.userId));
    assert.isTrue(queryStub.whereIn.calledWith("id", options.cartItemIds));
  });

  test("calcCartItemTotalPrice - should calculate total without extras", ({
    assert,
  }) => {
    const cartItem = new CartItem();
    cartItem.quantity = 2;
    cartItem.variation = {
      price: 1.5,
      product: { price: 10 },
    } as any;
    cartItem.cartItemExtras = [] as any;

    const total = cartItem.calcCartItemTotalPrice();

    // (10 * 1.5) * 2 = 30
    assert.equal(total.toString(), "30");
    assert.equal(cartItem.total.toString(), "30");
  });

  test("calcCartItemTotalPrice - should calculate total with extras", ({
    assert,
  }) => {
    const cartItem = new CartItem();
    cartItem.quantity = 2;
    cartItem.variation = {
      price: 1.5,
      product: { price: 10 },
    } as any;
    cartItem.cartItemExtras = [
      {
        quantity: 1,
        extra: { price: 2 },
      } as any,
      {
        quantity: 2,
        extra: { price: 3 },
      } as any,
    ] as any;

    const total = cartItem.calcCartItemTotalPrice();

    // ((10 * 1.5) + (2 * 1) + (3 * 2)) * 2 = (15 + 2 + 6) * 2 = 46
    assert.equal(total.toString(), "46");
    assert.equal(cartItem.total.toString(), "46");
  });

  test("validateExtraConstraint - should pass when extras belong to product", async ({
    assert,
  }) => {
    const cartItem = {
      variationId: 1,
      cartItemExtras: [{ extraId: 10 }, { extraId: 20 }],
    };

    const mockVariation = {
      id: 1,
      product: {
        id: 5,
        extras: [{ id: 10 }, { id: 20 }, { id: 30 }],
      },
    };

    const queryStub = {
      where: sandbox.stub().returnsThis(),
      preload: sandbox.stub().returnsThis(),
      firstOrFail: sandbox.stub().resolves(mockVariation),
    };

    sandbox.stub(Variation, "query").returns(queryStub as any);

    await assert.doesNotReject(() =>
      (CartItem as any).validateExtraConstraint(cartItem),
    );
  });

  test("validateExtraConstraint - should throw error when extra not in product", async ({
    assert,
  }) => {
    const cartItem = {
      variationId: 1,
      cartItemExtras: [{ extraId: 10 }, { extraId: 99 }],
    };

    const mockVariation = {
      id: 1,
      product: {
        id: 5,
        extras: [{ id: 10 }, { id: 20 }],
      },
    };

    const queryStub = {
      where: sandbox.stub().returnsThis(),
      preload: sandbox.stub().returnsThis(),
      firstOrFail: sandbox.stub().resolves(mockVariation),
    };

    sandbox.stub(Variation, "query").returns(queryStub as any);

    await assert.rejects(
      () => (CartItem as any).validateExtraConstraint(cartItem),
      "Extra not found in the product",
    );
  });

  test("storeCartItem - should create cart item with extras", async ({
    assert,
  }) => {
    const cartItemPost = {
      userId: 1,
      variationId: 10,
      quantity: 2,
      cartItemExtras: [
        { extraId: 5, quantity: 1 },
        { extraId: 6, quantity: 2 },
      ],
    };

    const mockCreatedCartItem = { id: 100 };

    sandbox.stub(CartItem as any, "validateExtraConstraint").resolves();
    sandbox.stub(CartItem, "create").resolves(mockCreatedCartItem as any);
    const cartItemExtraCreateStub = sandbox
      .stub(CartItemExtra, "create")
      .resolves();

    await CartItem.storeCartItem(cartItemPost);

    assert.isTrue(
      (CartItem as any).validateExtraConstraint.calledWith(cartItemPost),
    );
    assert.isTrue(
      (CartItem as any).create.calledWith({
        userId: cartItemPost.userId,
        variationId: cartItemPost.variationId,
        quantity: cartItemPost.quantity,
      }),
    );
    assert.equal(cartItemExtraCreateStub.callCount, 2);
    assert.isTrue(
      cartItemExtraCreateStub.firstCall.calledWith({
        cartItemId: mockCreatedCartItem.id,
        extraId: 5,
        quantity: 1,
      }),
    );
    assert.isTrue(
      cartItemExtraCreateStub.secondCall.calledWith({
        cartItemId: mockCreatedCartItem.id,
        extraId: 6,
        quantity: 2,
      }),
    );
  });

  test("updateCartItem - should update quantity and replace extras", async ({
    assert,
  }) => {
    const cartItemPost = {
      id: 100,
      quantity: 6,
      cartItemExtras: [{ extraId: 7, quantity: 2 }],
    };

    const mockCartItem = {
      id: 100,
      quantity: 5,
      variationId: 10,
      save: sandbox.stub().resolves(),
      related: sandbox.stub().returnsThis(),
      query: sandbox.stub().returnsThis(),
      delete: sandbox.stub().resolves(),
    };

    const mockValidateExtra = sandbox
      .stub(CartItem as any, "validateExtraConstraint")
      .resolves();
    sandbox.stub(CartItem, "findOrFail").resolves(mockCartItem as any);

    const cartItemExtraQueryStub = {
      where: sandbox.stub().returnsThis(),
      delete: sandbox.stub().resolves(),
    };
    sandbox.stub(CartItemExtra, "query").returns(cartItemExtraQueryStub as any);

    const cartItemExtraCreateStub = sandbox
      .stub(CartItemExtra, "create")
      .resolves();

    await CartItem.updateCartItem(cartItemPost as any);

    assert.equal(mockCartItem.quantity, 6);
    assert.isTrue(mockCartItem.save.calledOnce);
    assert.isTrue(mockCartItem.related.calledWith("cartItemExtras"));
    assert.isTrue(mockCartItem.query.calledOnce);
    assert.isTrue(mockCartItem.delete.calledOnce);
    assert.isTrue(
      cartItemExtraCreateStub.calledWith({
        cartItemId: 100,
        extraId: 7,
        quantity: 2,
      }),
    );

    const expectedValidateExtraCalls = {
      variationId: 10,
      cartItemExtras: [{ extraId: 7, quantity: 2 }],
    };

    assert.isTrue(mockValidateExtra.calledWith(expectedValidateExtraCalls));
  });

  test("calcCartItemTotalPrice - should handle decimal precision correctly", ({
    assert,
  }) => {
    const cartItem = new CartItem();
    cartItem.quantity = 3;
    cartItem.variation = {
      price: 1.33,
      product: { price: 9.99 },
    } as any;
    cartItem.cartItemExtras = [
      {
        quantity: 2,
        extra: { price: 1.5 },
      } as any,
    ] as any;

    const total = cartItem.calcCartItemTotalPrice();

    // ((9.99 * 1.33) + (1.50 * 2)) * 3 = (13.2867 + 3) * 3 = 48.8601
    assert.equal(total.toFixed(4), "48.8601");
  });
});
