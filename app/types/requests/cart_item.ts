export interface CartItemExtras {
    id: number
    quantity: number
}

export interface CartItemPayload {
    productId: number
    variationId: number
    quantity: number
    extras: Array<CartItemExtras>
}
  