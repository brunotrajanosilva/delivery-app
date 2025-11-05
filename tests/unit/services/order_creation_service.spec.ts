import { test } from "@japa/runner";
import sinon from "sinon";
import { DateTime } from "luxon";
import OrderCreationService from "#services/order_creation_service";
import CheckoutService from "#services/checkout_service";
import GatewayManager from "#modules/payment/services/gateway_manager";
import Order from "#models/user/order";
import db from "@adonisjs/lucid/services/db";

test.group("OrderCreationService", (group) => {
  let sandbox: sinon.SinonSandbox;
  let checkoutServiceStub: sinon.SinonStubbedInstance<CheckoutService>;
  let gatewayManagerStub: sinon.SinonStubbedInstance<GatewayManager>;
  let orderModelStub: sinon.SinonStubbedInstance<typeof Order>;
  let orderCreationService: OrderCreationService;
  let dbTransactionStub: sinon.SinonStub;

  group.each.setup(() => {
    sandbox = sinon.createSandbox();

    // Create stub instances
    checkoutServiceStub = sandbox.createStubInstance(CheckoutService);
    gatewayManagerStub = sandbox.createStubInstance(GatewayManager);

    // Stub Order model
    orderModelStub = {
      create: sandbox.stub(),
    } as any;

    // Stub db.transaction
    dbTransactionStub = sandbox.stub(db, "transaction");

    // Create service instance with mocked dependencies
    orderCreationService = new OrderCreationService(
      checkoutServiceStub as any,
      gatewayManagerStub as any,
      orderModelStub as any,
    );
  });

  group.each.teardown(() => {
    sandbox.restore();
  });

  test("should successfully process order creation", async ({ assert }) => {
    // Arrange
    const payload = {
      userId: 123,
      paymentGateway: "stripe",
      cartItems: [{ id: 1, quantity: 2 }],
    };

    const mockCheckoutCart = {
      totalPrice: "100.00",
      totalToPay: "90.00",
      couponId: 5,
      couponDiscount: "10.00",
      stocks: { "1": 2 },
      items: [
        {
          variation: {
            id: 10,
            name: "Medium",
            price: "50.00",
            isRecipe: false,
            product: {
              id: 1,
              name: "Test Product",
              price: "50.00",
              description: "Test Description",
            },
          },
          quantity: 2,
          total: 100,
          cartItemExtras: [
            {
              quantity: 1,
              extra: {
                id: 20,
                name: "Extra Cheese",
                price: "5.00",
              },
            },
          ],
        },
      ],
    };

    const mockOrder = {
      id: 999,
      uuid: "order-uuid-123",
      paymentId: "",
      save: sandbox.stub().resolves(),
      related: sandbox.stub().returns({
        createMany: sandbox.stub().resolves([]),
      }),
    };

    const mockGateway = {
      createPayment: sandbox.stub().resolves("payment-id-456"),
    };

    // Setup stubs
    checkoutServiceStub.startCart.resolves();
    checkoutServiceStub.getCheckout.returns(mockCheckoutCart as any);
    checkoutServiceStub.finishCheckout.resolves();

    gatewayManagerStub.use.returns(mockGateway as any);

    orderModelStub.create.resolves(mockOrder as any);

    // Mock transaction to execute callback immediately
    dbTransactionStub.callsFake(async (callback) => {
      const mockTrx = {
        /* transaction client mock */
      };
      return await callback(mockTrx);
    });

    // Act
    const result = await orderCreationService.process(payload as any);

    // Assert
    assert.equal(result, 999);

    // Verify cart service calls
    assert.isTrue(checkoutServiceStub.startCart.calledOnceWith(payload));
    assert.isTrue(checkoutServiceStub.getCheckout.calledOnce);
    assert.isTrue(checkoutServiceStub.finishCheckout.calledOnce);

    // Verify order creation
    assert.isTrue(orderModelStub.create.calledOnce);
    const orderCreateArgs = orderModelStub.create.firstCall.args[0] as any;
    assert.equal(orderCreateArgs.totalPrice, "100.00");
    assert.equal(orderCreateArgs.totalToPay, "90.00");
    assert.equal(orderCreateArgs.couponId, 5);
    assert.equal(orderCreateArgs.paymentGateway, "stripe");
    assert.equal(orderCreateArgs.userId, 123);
    assert.equal(orderCreateArgs.paymentStatus, "pending");
    assert.instanceOf(orderCreateArgs.expirationDate, DateTime as any);

    // Verify order items creation
    const createManyStub = mockOrder.related().createMany as sinon.SinonStub;
    assert.isTrue(createManyStub.calledOnce);
    const orderItems = createManyStub.firstCall.args[0];
    assert.lengthOf(orderItems, 1);
    assert.equal(orderItems[0].variationId, 10);
    assert.equal(orderItems[0].quantity, 2);
    assert.equal(orderItems[0].total, "100");
    assert.deepEqual(orderItems[0].details.product.id, 1);
    assert.deepEqual(orderItems[0].details.variation.id, 10);
    assert.lengthOf(orderItems[0].details.extras, 1);

    // Verify payment gateway calls
    assert.isTrue(gatewayManagerStub.use.calledOnceWith("stripe"));
    assert.isTrue(
      mockGateway.createPayment.calledOnceWith("order-uuid-123", 90.0, "BRL"),
    );
    assert.equal(mockOrder.paymentId, "payment-id-456");
    assert.isTrue(mockOrder.save.calledOnce);
  });

  test("should handle multiple cart items correctly", async ({ assert }) => {
    // Arrange
    const payload = {
      userId: 456,
      paymentGateway: "paypal",
      cartItems: [
        { id: 1, quantity: 1 },
        { id: 2, quantity: 3 },
      ],
    };

    const mockCheckoutCart = {
      totalPrice: "200.00",
      totalToPay: "200.00",
      couponId: null,
      couponDiscount: null,
      stocks: { "1": 1, "2": 3 },
      items: [
        {
          variation: {
            id: 11,
            name: "Small",
            price: "30.00",
            isRecipe: true,
            product: {
              id: 1,
              name: "Product A",
              price: "30.00",
              description: "Description A",
            },
          },
          quantity: 1,
          total: 30,
          cartItemExtras: [],
        },
        {
          variation: {
            id: 12,
            name: "Large",
            price: "60.00",
            isRecipe: false,
            product: {
              id: 2,
              name: "Product B",
              price: "60.00",
              description: "Description B",
            },
          },
          quantity: 3,
          total: 180,
          cartItemExtras: [
            {
              quantity: 2,
              extra: {
                id: 30,
                name: "Extra Item",
                price: "10.00",
              },
            },
          ],
        },
      ],
    };

    const mockOrder = {
      id: 888,
      uuid: "order-uuid-789",
      save: sandbox.stub().resolves(),
      related: sandbox.stub().returns({
        createMany: sandbox.stub().resolves([]),
      }),
    };

    const mockGateway = {
      createPayment: sandbox.stub().resolves("payment-id-789"),
    };

    checkoutServiceStub.startCart.resolves();
    checkoutServiceStub.getCheckout.returns(mockCheckoutCart as any);
    checkoutServiceStub.finishCheckout.resolves();
    gatewayManagerStub.use.returns(mockGateway as any);
    orderModelStub.create.resolves(mockOrder as any);

    dbTransactionStub.callsFake(async (callback) => {
      const mockTrx = {};
      return await callback(mockTrx);
    });

    // Act
    const result = await orderCreationService.process(payload as any);

    // Assert
    assert.equal(result, 888);

    const createManyStub = mockOrder.related().createMany as sinon.SinonStub;
    const orderItems = createManyStub.firstCall.args[0];
    assert.lengthOf(orderItems, 2);

    // Verify first item
    assert.equal(orderItems[0].variationId, 11);
    assert.equal(orderItems[0].quantity, 1);
    assert.lengthOf(orderItems[0].details.extras, 0);

    // Verify second item
    assert.equal(orderItems[1].variationId, 12);
    assert.equal(orderItems[1].quantity, 3);
    assert.lengthOf(orderItems[1].details.extras, 1);
    assert.equal(orderItems[1].details.extras[0].quantity, 2);
  });

  test("should set expiration date to 30 minutes from now", async ({
    assert,
  }) => {
    // Arrange
    const beforeTest = DateTime.now();
    const payload = {
      userId: 789,
      paymentGateway: "mercadopago",
      cartItems: [{ id: 1, quantity: 1 }],
    };

    const mockCheckoutCart = {
      totalPrice: "50.00",
      totalToPay: "50.00",
      couponId: null,
      couponDiscount: null,
      stocks: {},
      items: [],
    };

    const mockOrder = {
      id: 111,
      uuid: "order-uuid-111",
      save: sandbox.stub().resolves(),
      related: sandbox.stub().returns({
        createMany: sandbox.stub().resolves([]),
      }),
    };

    const mockGateway = {
      createPayment: sandbox.stub().resolves("payment-id-111"),
    };

    checkoutServiceStub.startCart.resolves();
    checkoutServiceStub.getCheckout.returns(mockCheckoutCart as any);
    checkoutServiceStub.finishCheckout.resolves();
    gatewayManagerStub.use.returns(mockGateway as any);
    orderModelStub.create.resolves(mockOrder as any);

    dbTransactionStub.callsFake(async (callback) => {
      return await callback({});
    });

    // Act
    await orderCreationService.process(payload as any);

    // Assert
    const orderData = orderModelStub.create.firstCall.args[0] as any;
    const expirationDate = orderData.expirationDate as DateTime;
    const expectedExpiration = beforeTest.plus({ minutes: 30 });

    assert.instanceOf(expirationDate, DateTime as any);

    // Allow 1 second tolerance for test execution time
    const diffInSeconds = Math.abs(
      expirationDate.diff(expectedExpiration, "seconds").seconds,
    );
    assert.isBelow(diffInSeconds, 1);
  });

  test("should pass transaction client to all database operations", async ({
    assert,
  }) => {
    // Arrange
    const payload = {
      userId: 999,
      paymentGateway: "stripe",
      cartItems: [],
    };

    const mockTrx = { isMockTransaction: true };
    const mockCheckoutCart = {
      totalPrice: "10.00",
      totalToPay: "10.00",
      couponId: null,
      couponDiscount: null,
      stocks: {},
      items: [],
    };

    const mockOrder = {
      id: 222,
      uuid: "order-uuid-222",
      save: sandbox.stub().resolves(),
      related: sandbox.stub().returns({
        createMany: sandbox.stub().resolves([]),
      }),
    };

    const mockGateway = {
      createPayment: sandbox.stub().resolves("payment-id-222"),
    };

    checkoutServiceStub.startCart.resolves();
    checkoutServiceStub.getCheckout.returns(mockCheckoutCart as any);
    checkoutServiceStub.finishCheckout.resolves();
    gatewayManagerStub.use.returns(mockGateway as any);
    orderModelStub.create.resolves(mockOrder as any);

    dbTransactionStub.callsFake(async (callback) => {
      return await callback(mockTrx);
    });

    // Act
    await orderCreationService.process(payload as any);

    // Assert
    const createOptions = orderModelStub.create.firstCall.args[1] as any;
    assert.deepEqual(createOptions.client, mockTrx);

    const createManyOptions = (
      mockOrder.related().createMany as sinon.SinonStub
    ).firstCall.args[1];
    assert.deepEqual(createManyOptions.client, mockTrx);

    assert.isTrue(
      checkoutServiceStub.finishCheckout.calledOnceWith(mockTrx as any),
    );
  });
});
