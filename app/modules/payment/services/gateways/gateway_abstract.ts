import type { OrderStatus } from "#types/order";

export default abstract class GatewayAbstract {
  // abstract name: string
  public abstract createPayment(
    orderUUID: string,
    amount: number,
    currency: string,
  ): Promise<string>;

  public abstract getPaymentStatus(paymentId: string): Promise<OrderStatus>;

  public abstract confirmPayment(paymentId: string): Promise<void>;

  public abstract cancelPayment(paymentId: string): Promise<void>;

  public abstract refundPayment(paymentId: string): Promise<void>;
}
