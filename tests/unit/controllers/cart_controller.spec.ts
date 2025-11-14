import { test } from "@japa/runner";
import sinon from "sinon";
import CartController from "#controllers/user/cart_controller";
import CartService from "#services/cart_service";
import CheckoutService from "#services/checkout_service";
import CartItem from "#models/user/cart_item";
import type { HttpContext } from "@adonisjs/core/http";

test.group("CartController", (group) => {
  let cartService: sinon.SinonStubbedInstance<CartService>;
  let checkoutService: sinon.SinonStubbedInstance<CheckoutService>;
  let cartController: CartController;
  let mockContext: Partial<HttpContext>;
  let cartItemStub: sinon.SinonStub;

  group.each.setup(() => {
    // Create stubbed instances
    cartService = sinon.createStubInstance(CartService);
    checkoutService = sinon.createStubInstance(CheckoutService);

    // Stub the static method on CartItem
    cartItemStub = sinon.stub(CartItem, "storeCartItem");
    sinon.stub(CartItem, "updateCartItem");

    // Create controller instance with mocked services
    cartController = new CartController(
      cartService as unknown as CartService,
      checkoutService as unknown as CheckoutService,
    );

    // Setup mock HTTP context
    mockContext = {
      auth: {
        user: {
          id: 1,
          email: "test@example.com",
        },
      } as any,
      request: {
        validateUsing: sinon.stub().resolves(),
        body: sinon.stub(),
        input: sinon.stub(),
      } as any,
      response: {
        ok: sinon.stub().returnsThis(),
        created: sinon.stub().returnsThis(),
        internalServerError: sinon.stub().returnsThis(),
      } as any,
    };

    return () => {
      sinon.restore();
    };
  });

  test("index - should retrieve cart successfully", async ({ assert }) => {
    const mockCartResponse = {
      items: [{ id: 1, productId: 1, quantity: 2 }],
      total: 100,
    };

    cartService.startCart.resolves();
    cartService.getCart.returns(mockCartResponse as any);

    await cartController.index(mockContext as HttpContext);

    assert.isTrue(cartService.startCart.calledOnceWith({ userId: 1 }));
    assert.isTrue(cartService.getCart.calledOnce);
    assert.isTrue(
      (mockContext.response!.ok as sinon.SinonStub).calledOnceWith({
        success: true,
        cartServiceResponse: mockCartResponse,
      }),
    );
  });

  test("index - should handle errors gracefully", async ({ assert }) => {
    const error = new Error("Database connection failed");
    cartService.startCart.rejects(error);

    await cartController.index(mockContext as HttpContext);

    assert.isTrue(
      (
        mockContext.response!.internalServerError as sinon.SinonStub
      ).calledOnceWith({
        success: false,
        message: "Failed to retrieve cart",
        error: error.message,
      }),
    );
  });

  test("store - should add item to cart successfully", async ({ assert }) => {
    const cartBody = {
      productId: 1,
      quantity: 2,
      variantId: 10,
    };

    (mockContext.request!.body as sinon.SinonStub).returns(cartBody);
    cartItemStub.resolves();

    await cartController.store(mockContext as HttpContext);

    assert.isTrue(
      (mockContext.request!.validateUsing as sinon.SinonStub).calledOnce,
    );
    assert.isTrue(
      cartItemStub.calledOnceWith({
        ...cartBody,
        userId: 1,
      }),
    );
  });

  test("store - should handle errors when adding item fails", async ({
    assert,
  }) => {
    const error = new Error("Failed to insert item");
    const cartBody = { productId: 1, quantity: 2 };

    (mockContext.request!.body as sinon.SinonStub).returns(cartBody);
    cartItemStub.rejects(error);

    await cartController.store(mockContext as HttpContext);

    assert.isTrue(
      (
        mockContext.response!.internalServerError as sinon.SinonStub
      ).calledOnceWith({
        success: false,
        message: "Failed to add item to cart",
        error: error.message,
      }),
    );
  });

  test("update - should update cart item successfully", async ({ assert }) => {
    const cartBody = {
      cartItemId: 1,
      quantity: 5,
    };

    (mockContext.request!.body as sinon.SinonStub).returns(cartBody);
    (CartItem.updateCartItem as sinon.SinonStub).resolves();

    await cartController.update(mockContext as HttpContext);

    assert.isTrue(
      (mockContext.request!.validateUsing as sinon.SinonStub).calledOnce,
    );
    assert.isTrue(
      (CartItem.updateCartItem as sinon.SinonStub).calledOnceWith({
        ...cartBody,
        userId: 1,
      }),
    );
  });

  test("update - should handle errors when updating item fails", async ({
    assert,
  }) => {
    const error = new Error("Item not found");
    const cartBody = { cartItemId: 1, quantity: 5 };

    (mockContext.request!.body as sinon.SinonStub).returns(cartBody);
    (CartItem.updateCartItem as sinon.SinonStub).rejects(error);

    await cartController.update(mockContext as HttpContext);

    assert.isTrue(
      (
        mockContext.response!.internalServerError as sinon.SinonStub
      ).calledOnceWith({
        success: false,
        message: "Failed to update cart item",
        error: error.message,
      }),
    );
  });

  test("checkout - should process checkout successfully", async ({
    assert,
  }) => {
    const cartItemIds = [1, 2, 3];
    const couponCode = "DISCOUNT10";
    const mockCheckoutResponse = {
      orderId: 123,
      total: 90,
      discount: 10,
    };

    (mockContext.request!.input as sinon.SinonStub)
      .withArgs("cartItemIds")
      .returns(cartItemIds);
    (mockContext.request!.input as sinon.SinonStub)
      .withArgs("couponCode")
      .returns(couponCode);

    checkoutService.startCart.resolves();
    checkoutService.getCheckout.returns(mockCheckoutResponse as any);

    await cartController.checkout(mockContext as HttpContext);

    assert.isTrue(
      (mockContext.request!.validateUsing as sinon.SinonStub).calledOnce,
    );
    assert.isTrue(
      checkoutService.startCart.calledOnceWith({
        userId: 1,
        cartItemIds,
        couponCode,
      }),
    );
    assert.isTrue(checkoutService.getCheckout.calledOnce);
    assert.isTrue(
      (mockContext.response!.created as sinon.SinonStub).calledOnceWith({
        success: true,
        message: "Checkout successful",
        data: mockCheckoutResponse,
      }),
    );
  });

  test("checkout - should handle errors during checkout", async ({
    assert,
  }) => {
    const error = new Error("Payment processing failed");
    const cartItemIds = [1, 2, 3];

    (mockContext.request!.input as sinon.SinonStub)
      .withArgs("cartItemIds")
      .returns(cartItemIds);
    (mockContext.request!.input as sinon.SinonStub)
      .withArgs("couponCode")
      .returns(null);

    checkoutService.startCart.rejects(error);

    await cartController.checkout(mockContext as HttpContext);

    assert.isTrue(
      (
        mockContext.response!.internalServerError as sinon.SinonStub
      ).calledOnceWith({
        success: false,
        message: "Failed to retrieve checkout",
        error: error.message,
      }),
    );
  });

  test("checkout - should handle checkout without coupon code", async ({
    assert,
  }) => {
    const cartItemIds = [1, 2];
    const mockCheckoutResponse = {
      orderId: 124,
      total: 100,
      discount: 0,
    };

    (mockContext.request!.input as sinon.SinonStub)
      .withArgs("cartItemIds")
      .returns(cartItemIds);
    (mockContext.request!.input as sinon.SinonStub)
      .withArgs("couponCode")
      .returns(undefined);

    checkoutService.startCart.resolves();
    checkoutService.getCheckout.returns(mockCheckoutResponse as any);

    await cartController.checkout(mockContext as HttpContext);

    assert.isTrue(
      checkoutService.startCart.calledOnceWith({
        userId: 1,
        cartItemIds,
        couponCode: undefined,
      }),
    );
    assert.isTrue(
      (mockContext.response!.created as sinon.SinonStub).calledOnceWith({
        success: true,
        message: "Checkout successful",
        data: mockCheckoutResponse,
      }),
    );
  });
});
