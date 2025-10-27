import CartItem from "#models/user/cart_item";
import { Decimal } from "decimal.js";
// import { inject } from "@adonisjs/core";

// @inject()
export default class CartService {
  protected readonly cartItemModel: typeof CartItem;
  protected cartItems: CartItem[];
  protected cartTotal: Decimal;

  constructor(__cartItemModel?: typeof CartItem) {
    this.cartItemModel = __cartItemModel || CartItem;
    this.cartItems = [];
    this.cartTotal = new Decimal("0");
  }

  protected async setCartItems(options: {
    userId: number;
    cartItemIds?: number[];
  }): Promise<void> {
    const checkoutCartItems = await this.cartItemModel.getCartItems(options);
    this.cartItems = checkoutCartItems;
  }

  protected setCartPrice(): void {
    let cartTotal = new Decimal("0");

    for (const cartItem of this.cartItems) {
      const cartItemTotal = cartItem.calcCartItemTotalPrice();
      cartTotal = cartTotal.add(cartItemTotal);
    }

    this.cartTotal = cartTotal;
  }

  public getCart(): {
    items: CartItem[];
    totalPrice: string;
  } {
    const result = {
      items: this.cartItems,
      totalPrice: this.cartTotal.toString(),
    };
    return result;
  }

  public async startCart(options: {
    userId: number;
    cartItemIds?: number[];
    couponCode?: string;
  }): Promise<void> {
    await this.setCartItems({ ...options });
    this.setCartPrice();
  }
}
