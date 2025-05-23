// app/Modules/Payments/Services/Gateways/StripeWebhookHandler.ts
import Stripe from 'stripe'
import { Env } from '@adonisjs/core/env'
import StripeClient from './stripe_client.js'
import OrderService from '#services/order_service'

export default class StripeWebhookHandler {
  private stripe = StripeClient.getInstance()
  private stripeWebhookSecret = Env.get('STRIPE_WEBHOOK_SECRET')

  verifyAndParse(rawBody: string, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(rawBody, signature, this.stripeWebhookSecret)
  }

  async handleEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderId = parseInt( paymentIntent.metadata.orderId ) 

        await OrderService.setOrderStatus(orderId, "paid")
        // update your database here
        break

      case 'charge.failed':
        console.log('❌ Charge failed')
        break

      default:
        console.log('Unhandled event:', event.type)
    }
  }
}
