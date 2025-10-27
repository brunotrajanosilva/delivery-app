import { test } from "@japa/runner";
import sinon from "sinon";
import CartService from "#services/cart_service";
import CartItem from "#models/user/cart_item";
import { Decimal } from "decimal.js";

test.group("CartService", (group) => {
  let sandbox: sinon.SinonSandbox;

  group.each.setup(() => {
    sandbox = sinon.createSandbox();
  });

  group.each.teardown(() => {
    sandbox.restore();
  });

  test("should initialize with empty cart and zero total", ({ assert }) => {
    const service = new CartService();
    const cart = service.getCart();

    assert.deepEqual(cart.items, []);
    assert.equal(cart.totalPrice, "0");
  });

  test("should accept CartItem model in constructor", ({ assert }) => {
    const MockCartItem = sandbox.stub() as any;
    const service = new CartService(MockCartItem);

    assert.exists(service);
  });

  test("should fetch cart items and calculate total price", async ({
    assert,
  }) => {
    const mockCartItems = [
      {
        id: 1,
        quantity: 2,
        // price: "10.00",
        calcCartItemTotalPrice: () => new Decimal("20.00"),
      },
      {
        id: 2,
        quantity: 1,
        // price: "15.50",
        calcCartItemTotalPrice: () => new Decimal("15.50"),
      },
    ] as CartItem[];

    const getCartItemsStub = sandbox
      .stub(CartItem, "getCartItems")
      .resolves(mockCartItems);

    const service = new CartService();
    await service.startCart({ userId: 1 });

    const cart = service.getCart();

    assert.isTrue(getCartItemsStub.calledOnce);
    assert.isTrue(
      getCartItemsStub.calledWithMatch({
        userId: 1,
      }),
    );
    assert.lengthOf(cart.items, 2);
    assert.equal(cart.totalPrice, "35.5");
  });

  test("should pass cartItemIds to getCartItems", async ({ assert }) => {
    const mockCartItems = [] as CartItem[];
    const getCartItemsStub = sandbox
      .stub(CartItem, "getCartItems")
      .resolves(mockCartItems);

    const service = new CartService();
    await service.startCart({
      userId: 1,
      cartItemIds: [1, 2, 3],
    });

    assert.isTrue(
      getCartItemsStub.calledWithMatch({
        userId: 1,
        cartItemIds: [1, 2, 3],
      }),
    );
  });

  test("should handle empty cart items", async ({ assert }) => {
    const getCartItemsStub = sandbox
      .stub(CartItem, "getCartItems")
      .resolves([]);

    const service = new CartService();
    await service.startCart({ userId: 1 });

    const cart = service.getCart();

    assert.isTrue(getCartItemsStub.calledOnce);
    assert.lengthOf(cart.items, 0);
    assert.equal(cart.totalPrice, "0");
  });

  test("should calculate correct total with multiple items", async ({
    assert,
  }) => {
    const mockCartItems = [
      {
        calcCartItemTotalPrice: () => new Decimal("100.00"),
      },
      {
        calcCartItemTotalPrice: () => new Decimal("50.25"),
      },
      {
        calcCartItemTotalPrice: () => new Decimal("25.75"),
      },
    ] as CartItem[];

    sandbox.stub(CartItem, "getCartItems").resolves(mockCartItems);

    const service = new CartService();
    await service.startCart({ userId: 1 });

    const cart = service.getCart();

    assert.equal(cart.totalPrice, "176");
  });

  test("should handle decimal precision correctly", async ({ assert }) => {
    const mockCartItems = [
      {
        calcCartItemTotalPrice: () => new Decimal("10.99"),
      },
      {
        calcCartItemTotalPrice: () => new Decimal("20.99"),
      },
    ] as CartItem[];

    sandbox.stub(CartItem, "getCartItems").resolves(mockCartItems);

    const service = new CartService();
    await service.startCart({ userId: 1 });

    const cart = service.getCart();

    assert.equal(cart.totalPrice, "31.98");
  });

  test("should accept couponCode parameter", async ({ assert }) => {
    const getCartItemsStub = sandbox
      .stub(CartItem, "getCartItems")
      .resolves([]);

    const service = new CartService();
    await service.startCart({
      userId: 1,
      couponCode: "SAVE10",
    });

    // Verify the method was called (couponCode is passed but not used in current implementation)
    assert.isTrue(getCartItemsStub.calledOnce);
  });

  test("should use injected CartItem model", async ({ assert }) => {
    const mockCartItems = [
      {
        calcCartItemTotalPrice: () => new Decimal("50.00"),
      },
    ] as CartItem[];

    const MockCartItem = {
      getCartItems: sandbox.stub().resolves(mockCartItems),
    } as any;

    const service = new CartService(MockCartItem);
    await service.startCart({ userId: 1 });

    const cart = service.getCart();

    assert.isTrue(MockCartItem.getCartItems.calledOnce);
    assert.equal(cart.totalPrice, "50");
  });

  test("should reset cart on subsequent startCart calls", async ({
    assert,
  }) => {
    const firstMockItems = [
      {
        calcCartItemTotalPrice: () => new Decimal("100.00"),
      },
    ] as CartItem[];

    const secondMockItems = [
      {
        calcCartItemTotalPrice: () => new Decimal("50.00"),
      },
    ] as CartItem[];

    const getCartItemsStub = sandbox.stub(CartItem, "getCartItems");
    getCartItemsStub.onFirstCall().resolves(firstMockItems);
    getCartItemsStub.onSecondCall().resolves(secondMockItems);

    const service = new CartService();

    await service.startCart({ userId: 1 });
    let cart = service.getCart();
    assert.equal(cart.totalPrice, "100");

    await service.startCart({ userId: 1 });
    cart = service.getCart();
    assert.equal(cart.totalPrice, "50");
  });
});
