import type { OrderPayload } from '#types/requests/order'

export interface OrderJobPayload extends OrderPayload {
  userId: number
}
