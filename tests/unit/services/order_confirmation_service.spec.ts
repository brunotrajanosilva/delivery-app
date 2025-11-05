import { test } from "@japa/runner";
import sinon from "sinon";
import OrderConfirmationService from "#services/order_confirmation_service";
import GatewayManager from "#modules/payment/services/gateway_manager";

test.group("OrderConfirmationService", (group) => {
  let service: OrderConfirmationService;
  let gatewayManagerStub: sinon.SinonStubbedInstance<GatewayManager>;
  let orderModelStub: any;
  let gatewayStub: any;

  group.each.setup(() => {
    // Create stubs
    gatewayManagerStub = sinon.createStubInstance(GatewayManager);

    // Mock gateway instance
    gatewayStub = {
      getPaymentStatus: sinon.stub(),
      cancelPayment: sinon.stub(),
      refundPayment: sinon.stub(),
    };

    gatewayManagerStub.use.returns(gatewayStub);

    // Mock Order model
    orderModelStub = {
      query: sinon.stub().returnsThis(),
      where: sinon.stub().returnsThis(),
      first: sinon.stub(),
    };

    // Create service instance with mocked dependencies
    service = new OrderConfirmationService(
      gatewayManagerStub as any,
      orderModelStub,
    );
  });

  group.each.teardown(() => {
    sinon.restore();
  });

  test("start() should load order by id", async ({ assert }) => {
    const mockOrder = {
      id: 1,
      paymentStatus: "pending",
      paymentGateway: "stripe",
      paymentId: "pay_123",
    };

    orderModelStub.first.resolves(mockOrder);

    await service.start(1);

    assert.isTrue(orderModelStub.query.calledOnce);
    assert.isTrue(orderModelStub.where.calledWith("id", 1));
  });

  test("start() should throw error if order not found", async ({ assert }) => {
    orderModelStub.first.resolves(null);

    await assert.rejects(() => service.start(999), "Order not found");
  });

  test("confirmOrderPayment() should return early if order is not pending", async ({
    assert,
  }) => {
    const mockOrder = {
      id: 1,
      paymentStatus: "completed",
      paymentGateway: "stripe",
      paymentId: "pay_123",
      save: sinon.stub().resolves(),
    };

    orderModelStub.first.resolves(mockOrder);
    await service.start(1);

    const result = await service.confirmOrderPayment();

    assert.equal(result, "Order not pending");
    assert.isFalse(gatewayManagerStub.use.called);
  });

  test("confirmOrderPayment() should cancel order if gateway status is pending", async ({
    assert,
  }) => {
    const mockOrder = {
      id: 1,
      paymentStatus: "pending",
      paymentGateway: "stripe",
      paymentId: "pay_123",
      save: sinon.stub().resolves(),
    };

    orderModelStub.first.resolves(mockOrder);
    gatewayStub.getPaymentStatus.resolves("pending");
    gatewayStub.cancelPayment.resolves();

    await service.start(1);
    const result = await service.confirmOrderPayment();

    assert.isTrue(gatewayManagerStub.use.calledWith("stripe"));
    assert.isTrue(gatewayStub.getPaymentStatus.calledWith("pay_123"));
    assert.isTrue(gatewayStub.cancelPayment.calledWith("pay_123"));
    assert.equal(mockOrder.paymentStatus, "cancelled");
    assert.isTrue(mockOrder.save.calledOnce);
    assert.equal(result, "updated to: cancelled");
  });

  test("confirmOrderPayment() should update status if gateway status is not pending", async ({
    assert,
  }) => {
    const mockOrder = {
      id: 1,
      paymentStatus: "pending",
      paymentGateway: "paypal",
      paymentId: "pay_456",
      save: sinon.stub().resolves(),
    };

    orderModelStub.first.resolves(mockOrder);
    gatewayStub.getPaymentStatus.resolves("completed");

    await service.start(1);
    const result = await service.confirmOrderPayment();

    assert.isTrue(gatewayStub.getPaymentStatus.calledWith("pay_456"));
    assert.isFalse(gatewayStub.cancelPayment.called);
    assert.equal(mockOrder.paymentStatus, "completed");
    assert.isTrue(mockOrder.save.calledOnce);
    assert.equal(result, "updated to: completed");
  });

  test("cancelPayment() should cancel payment and update order", async ({
    assert,
  }) => {
    const mockOrder = {
      id: 1,
      paymentStatus: "pending",
      paymentGateway: "stripe",
      paymentId: "pay_789",
      save: sinon.stub().resolves(),
    };

    orderModelStub.first.resolves(mockOrder);
    gatewayStub.cancelPayment.resolves();

    await service.start(1);
    await service.cancelPayment();

    assert.isTrue(gatewayManagerStub.use.calledWith("stripe"));
    assert.isTrue(gatewayStub.cancelPayment.calledWith("pay_789"));
    assert.equal(mockOrder.paymentStatus, "cancelled");
    assert.isTrue(mockOrder.save.calledOnce);
  });

  test("refundPayment() should refund payment and update order", async ({
    assert,
  }) => {
    const mockOrder = {
      id: 1,
      paymentStatus: "completed",
      paymentGateway: "paypal",
      paymentId: "pay_101",
      save: sinon.stub().resolves(),
    };

    orderModelStub.first.resolves(mockOrder);
    gatewayStub.refundPayment.resolves();

    await service.start(1);
    await service.refundPayment();

    assert.isTrue(gatewayManagerStub.use.calledWith("paypal"));
    assert.isTrue(gatewayStub.refundPayment.calledWith("pay_101"));
    assert.equal(mockOrder.paymentStatus, "refunded");
    assert.isTrue(mockOrder.save.calledOnce);
  });
});
