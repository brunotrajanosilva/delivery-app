import GatewayManager from "#modules/payment/services/gateway_manager";
import Order from "#models/user/order";
import { inject } from "@adonisjs/core";

@inject()
export default class OrderConfirmationService {
  private orderModel: typeof Order;
  private order: Order | null = null;

  constructor(
    private gatewayManager: GatewayManager,
    __orderModel: typeof Order,
  ) {
    this.orderModel = __orderModel || Order;
  }

  public async start(orderId: number): Promise<void> {
    const order = await this.orderModel.query().where("id", orderId).first();
    if (!order) throw new Error("Order not found");
    this.order = order;
  }

  // check if is paid. Intent to be used with the schedule job
  // order status needs to be pending(the initial state)
  // get gateway status. if returns pending, cancel order;
  // if not, update order status with gateway status
  public async confirmOrderPayment(): Promise<string> {
    const order = this.order!;
    if (order.paymentStatus != "pending") return "Order not pending";

    const gateway = this.gatewayManager.use(order.paymentGateway);
    const gatewayStatus = await gateway.getPaymentStatus(order.paymentId!);

    if (gatewayStatus == "pending") {
      order.paymentStatus = "cancelled";
      await gateway.cancelPayment(order.paymentId!);
    } else {
      order.paymentStatus = gatewayStatus;
    }
    await order.save();
    return "updated to: " + order.paymentStatus;
  }

  // forcing cancellation or refund
  public async cancelPayment(): Promise<void> {
    const order = this.order!;
    const gateway = this.gatewayManager.use(order.paymentGateway);
    const paymentId = order.paymentId!;
    await gateway.cancelPayment(paymentId);

    order.paymentStatus = "cancelled";
    await order.save();
  }

  public async refundPayment(): Promise<void> {
    const order = this.order!;
    const gateway = this.gatewayManager.use(order.paymentGateway);
    const paymentId = order.paymentId!;
    await gateway.refundPayment(paymentId);

    order.paymentStatus = "refunded";
    await order.save();
  }
}
