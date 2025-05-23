import Stripe from 'stripe'
import { Env } from '@adonisjs/core/env'

class StripeClient {
  private static instance: Stripe

  public static getInstance(): Stripe {
    if (!this.instance) {
      this.instance = new Stripe(Env.get('STRIPE_SECRET') )
      // ,{apiVersion: '2024-04-10',})
    }
    return this.instance
  }
}

export default StripeClient
