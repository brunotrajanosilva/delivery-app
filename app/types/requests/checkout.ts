export interface CheckoutRequest {
  userId: number;
  cartItemIds: number[];
  couponCode?: string;
}
