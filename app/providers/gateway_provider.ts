import GatewayManager from "#modules/payment/services/gateway_manager";
import GatewayMock from "#modules/payment/services/gateways/gateway_mock";

import { ApplicationService } from "@adonisjs/core/types";

export default class GatewayProvider {
  constructor(protected app: ApplicationService) {}

  public register() {
    this.app.container.singleton(GatewayManager, () => {
      const paymentManager = new GatewayManager();

      //add all the gateways
      paymentManager.add("mock", new GatewayMock());

      return paymentManager;
    });
  }
}
