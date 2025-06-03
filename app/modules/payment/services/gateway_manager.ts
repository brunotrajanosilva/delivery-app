import GatewayAbstract from "./gateways/gateway_abstract.js"

export class GatewayManager {
  private gateways = new Map<string, GatewayAbstract>()

  add(name: string, gateway: GatewayAbstract) {
    this.gateways.set(name, gateway)
  }

  use(name: string): GatewayAbstract {
    const gateway = this.gateways.get(name)
    if (!gateway) throw new Error(`Gateway "${name}" not found`)
    return gateway
  }

  public getPaymentGateways(): string[] {
    return Array.from(this.gateways.keys())
  }
}
