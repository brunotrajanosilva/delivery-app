import { GatewayManager } from "./services/gateway_manager.js";
import StripeGateway from "./services/gateways/stripe/stripe_gateway.js";

const paymentManager = new GatewayManager();

paymentManager.add('stripe', new StripeGateway())
// paymentManager.add('paypal', new StripeGateway())

export default paymentManager;