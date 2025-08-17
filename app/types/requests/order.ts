export interface OrderPayload {
  couponCode: string | null
  paymentGateway: string
  cartItemIds: number[]
}
