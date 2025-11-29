import { CheckoutRequest } from "./checkout.js";

export interface OrderCreationRequest extends CheckoutRequest {
  paymentGateway: string;
  paymentMethod: string;
}
