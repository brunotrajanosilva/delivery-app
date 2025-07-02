import GatewayAbstract from "../gateway_abstract.js"
import StripeClient from "./stripe_client.js"

import Stripe from "stripe"
// import {StripeClient} from "./stripe_client"

export default class StripeGateway extends GatewayAbstract {
  private stripe = StripeClient.getInstance()


  public async createPayment(orderId: number, amount: string, currency: string) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount, // in cents
      currency,
      metadata: {
        orderId: orderId.toString()
      }
      // payment_method_types: ['card'],
    })
    return paymentIntent
  }

  public async getPaymentStatus(paymentId: string): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId)
    return paymentIntent
    /* return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    } */

  }

  public async refund(paymentId: string) {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentId,
    })

    return refund
  }



}
  