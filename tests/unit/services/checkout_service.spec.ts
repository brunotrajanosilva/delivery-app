import { test } from "@japa/runner";
import sinon from "sinon";
import { Decimal } from "decimal.js";

import CheckoutService from "#services/checkout_service";
import StockService from "#services/stock_service";
import CartItem from "#models/user/cart_item";
import Coupon from "#models/user/coupon";

test.group("CheckoutService", (group) => {
  let checkoutService: CheckoutService;
  let stockServiceStub: sinon.SinonStubbedInstance<StockService>;
  let couponModelStub: sinon.SinonStubbedInstance<typeof Coupon>;
  let sandbox: sinon.SinonSandbox;

  group.each.setup(() => {
    sandbox = sinon.createSandbox();

    // Create stub for StockService
    stockServiceStub = sandbox.createStubInstance(StockService);

    // Create stub for Coupon model
    couponModelStub = {
      findByCode: sandbox.stub(),
    } as any;

    // Create instance with mocked dependencies
    checkoutService = new CheckoutService(
      stockServiceStub as any,
      couponModelStub as any,
    );

    return () => sandbox.restore();
  });

  test("should return cart total when no coupon is applied", ({ assert }) => {
    const mockCartItems = [{ id: 1 }, { id: 2 }] as CartItem[];

    (checkoutService as any).cartItems = mockCartItems;
    (checkoutService as any).cartTotal = new Decimal(30);

    // Act
    const total = checkoutService.getCheckoutTotal();

    // Assert
    assert.equal(total.toString(), "30");
  });

  test("should apply coupon discount to total", async ({ assert }) => {
    // Arrange
    const mockCoupon = {
      id: 1,
      discount: new Decimal(5),
      apply: sandbox.stub(),
    } as any;

    couponModelStub.findByCode.resolves(mockCoupon);
    (checkoutService as any).cartTotal = new Decimal(30);

    // Act
    await (checkoutService as any).setCoupon("TESTCODE");
    const total = checkoutService.getCheckoutTotal();

    // Assert
    assert.equal(total.toString(), "25");
    assert.isTrue(couponModelStub.findByCode.calledOnceWith("TESTCODE"));
    assert.isTrue(mockCoupon.apply.calledOnce);
  });

  test("should return checkout data with all fields", ({ assert }) => {
    // Arrange
    const mockCartItems = [{ id: 1 }, { id: 2 }] as CartItem[];

    const mockCoupon = {
      id: 1,
      discount: new Decimal(5),
    } as any;

    const mockStocks = [
      { itemId: 1, itemType: "ingredient", quantity: 10 },
    ] as any;

    (checkoutService as any).cartItems = mockCartItems;
    (checkoutService as any).cartTotal = new Decimal(30);
    (checkoutService as any).couponInstance = mockCoupon;
    stockServiceStub.getIngredientsStack.returns(mockStocks);

    // Act
    const checkout = checkoutService.getCheckout();

    // Assert
    assert.deepEqual(checkout.items, mockCartItems);
    assert.equal(checkout.totalPrice, "30");
    assert.equal(checkout.totalToPay, "25");
    assert.equal(checkout.couponId, 1);
    assert.equal(checkout.couponDiscount, "5");
    assert.deepEqual(checkout.stocks, mockStocks);
  });

  test("should start cart successfully with coupon", async ({ assert }) => {
    // Arrange
    const mockCoupon = {
      id: 1,
      discount: new Decimal(5),
      apply: sandbox.stub(),
    } as any;

    const mockCartItems = [{ id: 1 }] as CartItem[];

    couponModelStub.findByCode.resolves(mockCoupon);
    stockServiceStub.hasStocks.returns(true);

    // Stub the parent startCart method
    const superStartCartStub = sandbox.stub(
      Object.getPrototypeOf(CheckoutService.prototype),
      "startCart",
    );
    superStartCartStub.callsFake(async function (this: any) {
      this.cartItems = mockCartItems;
      this.cartTotal = new Decimal(10);
    });

    // Act
    await checkoutService.startCart({
      userId: 1,
      cartItemIds: [1],
      couponCode: "TESTCODE",
    });

    // Assert
    assert.isTrue(superStartCartStub.calledOnce);
    assert.isTrue(couponModelStub.findByCode.calledOnceWith("TESTCODE"));
    assert.isTrue(stockServiceStub.start.calledOnce);
    assert.isTrue(stockServiceStub.hasStocks.calledOnce);

    superStartCartStub.restore();
  });

  test("should throw error when stocks are insufficient", async ({
    assert,
  }) => {
    // Arrange
    const mockCartItems = [{ id: 1 }] as CartItem[];

    stockServiceStub.hasStocks.returns(false);

    const superStartCartStub = sandbox.stub(
      Object.getPrototypeOf(CheckoutService.prototype),
      "startCart",
    );
    superStartCartStub.callsFake(async function (this: any) {
      this.cartItems = mockCartItems;
      this.cartTotal = new Decimal(10);
    });

    // Act & Assert
    await assert.rejects(
      () => checkoutService.startCart({ userId: 1 }),
      "Not enough stock",
    );

    superStartCartStub.restore();
  });

  test("should handle coupon error gracefully", async ({ assert }) => {
    // Arrange
    const mockCartItems = [{ id: 1 }] as CartItem[];

    const couponError = new Error("Invalid coupon");
    couponModelStub.findByCode.rejects(couponError);
    stockServiceStub.hasStocks.returns(true);

    const superStartCartStub = sandbox.stub(
      Object.getPrototypeOf(CheckoutService.prototype),
      "startCart",
    );
    superStartCartStub.callsFake(async function (this: any) {
      this.cartItems = mockCartItems;
      this.cartTotal = new Decimal(10);
    });

    // Act
    await checkoutService.startCart({
      userId: 1,
      couponCode: "INVALID",
    });

    // Assert
    const errors = (checkoutService as any).errors;
    assert.include(errors, "Invalid coupon");

    superStartCartStub.restore();
  });

  test("should finish checkout and delete cart items", async ({ assert }) => {
    // Arrange
    const mockTrx = {} as any;

    const mockCartItems = [
      {
        id: 1,
        useTransaction: sandbox.stub(),
        delete: sandbox.stub().resolves(),
      },
      {
        id: 2,
        useTransaction: sandbox.stub(),
        delete: sandbox.stub().resolves(),
      },
    ] as any;

    const mockCoupon = {
      id: 1,
      use: sandbox.stub().resolves(),
    } as any;

    (checkoutService as any).cartItems = mockCartItems;
    (checkoutService as any).couponInstance = mockCoupon;
    stockServiceStub.reserveStocks.resolves();

    // Act
    await checkoutService.finishCheckout(mockTrx);

    // Assert
    assert.isTrue(stockServiceStub.reserveStocks.calledOnceWith(mockTrx));
    assert.isTrue(mockCartItems[0].useTransaction.calledOnceWith(mockTrx));
    assert.isTrue(mockCartItems[0].delete.calledOnce);
    assert.isTrue(mockCartItems[1].useTransaction.calledOnceWith(mockTrx));
    assert.isTrue(mockCartItems[1].delete.calledOnce);
    assert.isTrue(mockCoupon.use.calledOnceWith(mockTrx));
  });

  test("should finish checkout without coupon", async ({ assert }) => {
    // Arrange
    const mockTrx = {} as any;

    const mockCartItems = [
      {
        id: 1,
        useTransaction: sandbox.stub(),
        delete: sandbox.stub().resolves(),
      },
    ] as any;

    (checkoutService as any).cartItems = mockCartItems;
    (checkoutService as any).couponInstance = null;
    stockServiceStub.reserveStocks.resolves();

    // Act
    await checkoutService.finishCheckout(mockTrx);

    // Assert
    assert.isTrue(stockServiceStub.reserveStocks.calledOnceWith(mockTrx));
    assert.isTrue(mockCartItems[0].delete.calledOnce);
  });

  test("should return ingredients stocks", ({ assert }) => {
    // Arrange
    const mockStocks = [
      { itemId: 1, itemType: "ingredient", quantity: 10 },
      { itemId: 2, itemType: "ingredient", quantity: 100 },
    ] as any;

    stockServiceStub.getIngredientsStack.returns(mockStocks);

    // Act
    const stocks = checkoutService.getIngredientsStocks();

    // Assert
    assert.deepEqual(stocks, mockStocks);
    assert.isTrue(stockServiceStub.getIngredientsStack.calledOnce);
  });
});
