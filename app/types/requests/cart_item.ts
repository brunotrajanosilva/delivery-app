export interface CartItemExtras {
    id: number
    quantity: number
}

export interface CartItemPayload {
    productId: number
    quantity: number
    details: {
        variation: number
        extras: Array<CartItemExtras>
    }
}
  