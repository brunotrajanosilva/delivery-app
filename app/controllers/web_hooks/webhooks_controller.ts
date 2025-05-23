// app/Controllers/Http/StripeWebhookController.ts
import Stripe from 'stripe'
import {Env} from '@adonisjs/core/env'
import { StripeWebhookHandler } from 'App/Modules/Payments/Services/Gateways/StripeWebhookHandler'

// const stripe = new Stripe(Env.get('STRIPE_SECRET'), {
//   apiVersion: '2024-04-10',
// })
// const handler = new StripeWebhookHandler(stripe, Env.get('STRIPE_WEBHOOK_SECRET'))

export default class StripeWebhookController {
  async handle({ request, response }) {
    const webhook = new StripeWebhookHandler()

    const rawBody = request.raw()
    const signature = request.header('stripe-signature')!

    try {
      const event = webhook.verifyAndParse(rawBody, signature)
      await webhook.handleEvent(event)
    } catch (err) {
      console.error(err)
      return response.badRequest('Webhook error')
    }

    return response.ok({})
  }
}
