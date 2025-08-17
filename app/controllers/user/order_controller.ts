import type { HttpContext } from '@adonisjs/core/http'
import PaginatedResponse from '#utils/paginated_response'
import Order from '#models/user/order'

import OrderService from '#services/order_service'
import ResponseHelper from '#helpers/responses/responses_helper'

export default class OrderController {
  async index({ auth, request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('perPage', 10)
      const user = auth.user

      const orders = await Order.query()
        .where('user_id', user.id)
        .preload('items')
        .orderBy('created_at', 'desc')

      const ordersPaginated = orders!.paginate(page, perPage)
      const ordersResponse = ResponseHelper.format(ordersPaginated)

      return response.ok({
        success: true,
        ...ordersResponse,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Failed to retrieve orders',
        error: error.message,
      })
    }
  }

  async show({ auth, params, response }: HttpContext) {
    try {
      const orderId = params.id
      const user = auth.user

      const orders = await Order.query()
        .where('id', orderId)
        .where('user_id', user.id)
        .preload('items')
        .orderBy('created_at', 'desc')
        .first()

      return response.ok({
        message: 'Order retrieved successfully',
        data: orders!.serialize(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to retrieve order',
        error: error.message,
      })
    }
  }

  async finish({ request, response }: HttpContext) {
    try {
      // TODO: Validate request data
      // const payload = await request.validateUsing(finishOrderValidator)

      // TODO: Implement order completion logic using OrderService
      // const result = await OrderService.finishOrder(payload)

      return response.created({
        message: 'Order completed successfully',
        data: request.body(), // Replace with actual order completion result
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to complete order',
        error: error.message,
      })
    }
  }

  /**
   * Handle payment webhook notifications
   */
  async paymentWebhook({ request, response }: HttpContext) {
    try {
      // TODO: Verify webhook signature/authenticity
      // const signature = request.header('x-webhook-signature')
      // const isValid = await OrderService.verifyWebhookSignature(request.body(), signature)

      // TODO: Process webhook payload
      // const webhookData = request.body()
      // await OrderService.processPaymentWebhook(webhookData)

      return response.ok({
        message: 'Webhook processed successfully',
      })
    } catch (error) {
      // Log error but return success to avoid webhook retries
      // Logger.error('Payment webhook error:', error)

      return response.ok({
        message: 'Webhook received',
      })
    }
  }
}
