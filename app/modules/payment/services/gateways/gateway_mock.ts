import GatewayAbstract from "./gateway_abstract.js";
import type { OrderStatus } from "#types/order";
import Order from "#models/user/order";

export default class GatewayMock extends GatewayAbstract {
  // abstract name: string
  public async createPayment(
    orderUUID: string,
    amount: number,
    currency: string,
  ): Promise<string> {
    const created = { id: "pi_test_" + orderUUID };
    return Promise.resolve(created.id);
  }

  public async getPaymentStatus(paymentId: string): Promise<OrderStatus> {
    return Promise.resolve("pending");
  }

  public async confirmPayment(paymentId: string): Promise<void> {}
  public async cancelPayment(paymentId: string): Promise<void> {}
  public async refundPayment(paymentId: string): Promise<void> {}
}
