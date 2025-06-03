
export default abstract class GatewayAbstract {

    // abstract name: string
    abstract createPayment(orderId: number, amount: string, currency: string): Promise<any>
    abstract getPaymentStatus(paymentId: string): Promise<any>
    abstract refund(paymentId:string): Promise<any>
}