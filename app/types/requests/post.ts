export interface CartItemStore {
  userId: number;
  variationId: number;
  quantity: number;
  cartItemExtras: CartItemExtras[];
}

interface CartItemExtras {
  extraId: number;
  quantity: number;
}

export interface CartItemUpdate extends CartItemStore {
  id: number;
}
