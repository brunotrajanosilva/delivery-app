import { test } from "@japa/runner";
import sinon from "sinon";
import { DateTime } from "luxon";
import { Decimal } from "decimal.js";

import CartService from "#services/cart_service";
import CartItem from "#models/user/cart_item";
import Coupon from "#models/user/coupon";
import StockService from "#services/stock_service";

test.group("CartService", (group) => {
  let cartService: CartService;
  let cartItemQueryStub: sinon.SinonStub; //sinon.SinonStubbedInstance<typeof CartItem.query>
  let couponFindByCodeStub: sinon.SinonStub;
  let mockStockService: sinon.SinonStubbedInstance<StockService>;
  let mockTrx: any;
  let mockCartItems: any;

  // Mock coupon instance
  const mockCouponInstance = {
    id: 1,
    code: "SAVE10",
    discount: new Decimal("5.00"),
    apply: sinon.stub(),
    use: sinon.stub().resolves(),
  };

  group.teardown(() => {
    sinon.restore();
  });

  group.each.setup(() => {
    sinon.restore();
    // mockCartItemQuery = sinon.stub(CartItem.query)

    mockStockService = sinon.createStubInstance(StockService);

    mockCartItems = [
      {
        id: 1,
        quantity: 2,
        total: new Decimal("20.00"),
        variation: {
          id: 1,
          name: "Medium",
          price: new Decimal("8.00"),
          isRecipe: false,
          product: {
            id: 1,
            name: "Pizza Margherita",
            price: new Decimal("8.00"),
            description: "Classic pizza",
          },
        },
        cartItemExtras: [
          {
            quantity: 1,
            extra: {
              id: 1,
              name: "Extra Cheese",
              price: new Decimal("2.00"),
            },
          },
        ],
        calcCartItemTotalPrice: sinon.stub().returns(new Decimal("20.00")),
        delete: sinon.stub().resolves(),
      },
      {
        id: 2,
        quantity: 1,
        total: new Decimal("15.00"),
        variation: {
          id: 2,
          name: "Large",
          price: new Decimal("12.00"),
          isRecipe: true,
          product: {
            id: 2,
            name: "Custom Burger",
            price: new Decimal("12.00"),
            description: "Build your own burger",
          },
        },
        cartItemExtras: [
          {
            quantity: 2,
            extra: {
              id: 2,
              name: "Bacon",
              price: new Decimal("1.50"),
            },
          },
        ],
        calcCartItemTotalPrice: sinon.stub().returns(new Decimal("15.00")),
        delete: sinon.stub().resolves(),
      },
    ];

    mockTrx = {
      commit: sinon.stub().resolves(),
      rollback: sinon.stub().resolves(),
    };

    // Setup CartItem query chain
    const mockQuery = {
      whereIn: sinon.stub().returnsThis(),
      preload: sinon.stub().returnsThis(),
      exec: sinon.stub().resolves(mockCartItems),
      //   then: sinon.stub().resolves(mockCartItems),
    };
    // mockQuery.preload.resolves(mockCartItems)
    cartItemQueryStub = sinon.stub(CartItem, "query").returns(mockQuery as any);
    couponFindByCodeStub = sinon
      .stub(Coupon, "findByCode")
      .resolves(mockCouponInstance as any);
    // couponApplyStub = sinon.stub(Coupon, 'apply').resolves(new Decimal('4.48'))
    mockStockService.start.resolves();
    mockStockService.hasStocks.resolves(true);

    // Setup Coupon findByCode
    // mockCoupon.findByCode = sinon.stub().resolves(mockCouponInstance) as any

    // Create CartService instance
    cartService = new CartService(CartItem, Coupon, mockStockService as any);
  });

  group.each.teardown(() => {
    sinon.restore();
  });

  test("start method should initialize checkout cart and validate stock", async ({
    assert,
  }) => {
    // Setup
    const cartItemIds = [1, 2];
    const couponCode = "SAVE10";

    // mockStockService.start.returns()
    // mockStockService.hasStocks.returns(true)

    await cartService.start(cartItemIds, couponCode);

    assert.isTrue(cartItemQueryStub.calledOnce);
    assert.isTrue(mockStockService.start.calledOnce);
    assert.isTrue(mockStockService.hasStocks.calledOnce);
    assert.isTrue(couponFindByCodeStub.calledWith(couponCode));
    assert.isTrue(mockCouponInstance.apply.calledOnce);
  });

  test("start method should throw error when not enough stock", async ({
    assert,
  }) => {
    const cartItemIds = [1, 2];

    mockStockService.hasStocks.returns(false);

    await assert.rejects(
      () => cartService.start(cartItemIds),
      "Not enough stock",
    );
  });

  test("start method should work without coupon code", async ({ assert }) => {
    const cartItemIds = [1, 2];

    await cartService.start(cartItemIds);

    assert.isTrue(cartItemQueryStub.calledOnce);
    assert.isTrue(mockStockService.start.calledOnce);
    assert.isTrue(mockStockService.hasStocks.calledOnce);
    assert.isFalse(mockCouponInstance.apply.notCalled);
  });

  test("getCheckoutCartTotal should return total without coupon", async ({
    assert,
  }) => {
    const cartItemIds = [1, 2];

    await cartService.start(cartItemIds);
    const total = cartService.getCheckoutCartTotal();

    assert.instanceOf(total, Decimal);
    assert.equal(total.toString(), "35");
  });

  test("getCheckoutCartTotal should return total with coupon discount", async ({
    assert,
  }) => {
    const cartItemIds = [1, 2];
    const couponCode = "SAVE10";

    await cartService.start(cartItemIds, couponCode);
    const total = cartService.getCheckoutCartTotal();

    assert.instanceOf(total, Decimal);
    assert.equal(total.toString(), "30"); // 0 - 5 (coupon discount)
  });

  test("getCheckoutCart should return checkout cart items", async ({
    assert,
  }) => {
    const cartItemIds = [1, 2];

    await cartService.start(cartItemIds);

    const checkoutCart = cartService.getCheckoutCart();

    assert.isArray(checkoutCart);
    assert.lengthOf(checkoutCart, 2);
    assert.equal(checkoutCart[0].id, 1);
    assert.equal(checkoutCart[1].id, 2);
  });

  test("getCheckoutCartResponse should return formatted response", async ({
    assert,
  }) => {
    const cartItemIds = [1, 2];
    const couponCode = "SAVE10";

    await cartService.start(cartItemIds, couponCode);

    const response = cartService.getCheckoutCartResponse();

    assert.properties(response, [
      "checkoutCart",
      "checkoutCartTotal",
      "couponDiscount",
      "total",
    ]);
    assert.isArray(response.checkoutCart);
    assert.instanceOf(response.checkoutCartTotal, Decimal);
    assert.instanceOf(response.couponDiscount, Decimal);
    assert.instanceOf(response.total, Decimal);
  });

  test("formatOrder should return properly formatted order", async ({
    assert,
  }) => {
    const cartItemIds = [1, 2];
    const couponCode = "SAVE10";

    mockStockService.getFormatedStocks.returns([
      { itemId: 1, itemType: "ingredient", quantity: 2 },
    ]);

    await cartService.start(cartItemIds, couponCode);

    const order = cartService.formatOrder();

    assert.properties(order, [
      "totalPrice",
      "totalToPay",
      "couponId",
      "couponDiscount",
      "expirationDate",
      "status",
      "stocks",
    ]);
    assert.equal(order.status, "processing");
    assert.equal(order.couponId, 1);
    assert.equal(order.couponDiscount, "5");
    assert.instanceOf(order.expirationDate, DateTime as any);
    assert.isArray(order.stocks);
  });

  test("formatOrder should work without coupon", async ({ assert }) => {
    const cartItemIds = [1, 2];

    mockStockService.getFormatedStocks.returns([]);

    await cartService.start(cartItemIds);

    const order = cartService.formatOrder();

    assert.isUndefined(order.couponId);
    assert.isUndefined(order.couponDiscount);
  });

  test("formatOrderItems should return properly formatted order items", async ({
    assert,
  }) => {
    const cartItemIds = [1, 2];

    await cartService.start(cartItemIds);
    const orderItems = cartService.formatOrderItems();

    assert.isArray(orderItems);
    assert.lengthOf(orderItems, 2);

    const firstItem = orderItems[0];
    assert.properties(firstItem, [
      "variationId",
      "details",
      "quantity",
      "total",
    ]);
    assert.equal(firstItem.variationId, 1);
    assert.equal(firstItem.quantity, 2);
    assert.equal(firstItem.total, "20");

    // Check details structure
    assert.properties(firstItem.details, ["product", "variation", "extras"]);
    assert.properties(firstItem.details?.product, [
      "id",
      "name",
      "price",
      "description",
    ]);
    assert.properties(firstItem.details?.variation, [
      "id",
      "name",
      "price",
      "isRecipe",
    ]);
    assert.isArray(firstItem.details?.extras);

    // Check extras structure
    const extra = firstItem.details?.extras[0];
    assert.properties(extra, ["id", "name", "price", "quantity"]);
    assert.equal(extra?.id, 1);
    assert.equal(extra?.name, "Extra Cheese");
    assert.equal(extra?.quantity, 1);
    assert.equal(extra?.price, "2");
  });

  test("finishCheckout should execute all cleanup operations", async ({
    assert,
  }) => {
    const cartItemIds = [1, 2];
    const couponCode = "SAVE10";

    mockStockService.reserveStocks.resolves();
    await cartService.start(cartItemIds, couponCode);
    await cartService.finishCheckout(mockTrx);

    assert.isTrue(mockStockService.reserveStocks.calledOnce);
    assert.isTrue(mockCouponInstance.use.calledWith(mockTrx));
    assert.isTrue(mockCartItems[0].delete.calledOnce);
    assert.isTrue(mockCartItems[1].delete.calledOnce);
  });

  test("finishCheckout should work without coupon", async ({ assert }) => {
    const cartItemIds = [1, 2];

    mockStockService.reserveStocks.resolves();
    await cartService.start(cartItemIds);
    await cartService.finishCheckout(mockTrx);

    assert.isTrue(mockStockService.reserveStocks.calledOnce);
    assert.isTrue(mockCartItems[0].delete.calledOnce);
    assert.isTrue(mockCartItems[1].delete.calledOnce);
  });
});
