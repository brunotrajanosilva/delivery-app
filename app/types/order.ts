import { Decimal } from 'decimal.js'
import { DateTime } from 'luxon'

import { StockHandler } from './stock.js'

export type OrderStatus = 'processing' | 'processed' | 'paid' | 'cancelled'

export interface OrderProperties {
  //   id: number
  //   uuid: string
  userId?: number
  totalPrice: Decimal
  couponId: number | null
  couponDiscount: Decimal | null
  totalToPay: Decimal
  status: OrderStatus
  paymentGateway?: string
  paymentMethod?: string
  expirationDate: Date
  stocks: StockHandler[]
}

export interface OrderItemDetails {
  variation: {
    id: number
    name: string
    price: string
    isRecipe: boolean
  }
  product: {
    id: number
    name: string
    price: string
    description: string
  }
  extras: OrderItemDetailsExtra[]
}

export interface OrderItemDetailsExtra {
  id: number
  name: string
  price: string
  quantity: number
}

// export interface OrderItemProperties {
//   variationId: number
//   details: OrderItemDetails
//   quantity: number
//   total: Decimal
// }
