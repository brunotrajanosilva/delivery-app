import type { HttpContext } from "@adonisjs/core/http";
import CartService from "#services/cart_service";
import CheckoutService from "#services/checkout_service";
import { inject } from "@adonisjs/core";
import CartItem from "#models/user/cart_item";
import type { CartItemStore, CartItemUpdate } from "#types/requests/post";
import type { CheckoutRequest } from "#types/requests/checkout";

import {
  cartItemStoreValidator,
  cartItemUpdateValidator,
  checkoutCartValidator,
} from "#validators/cart";

@inject()
export default class CartController {
  private cartItemModel: typeof CartItem;

  constructor(
    private cartService: CartService,
    private checkoutService: CheckoutService,
  ) {
    this.cartItemModel = CartItem;
  }

  async index({ auth, response }: HttpContext) {
    try {
      const userId = auth.user!.id;

      await this.cartService.startCart({ userId });
      const cartServiceResponse = this.cartService.getCart();

      return response.ok({
        success: true,
        data: cartServiceResponse,
      });
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: "Failed to retrieve cart",
        error: error.message,
      });
    }
  }

  async store({ auth, request, response }: HttpContext) {
    await request.validateUsing(cartItemStoreValidator);
    try {
      const user = auth.user!;
      const cartBody = request.body() as CartItemStore;
      cartBody.userId = user.id;

      await this.cartItemModel.storeCartItem(cartBody);
      return response.ok({
        success: true,
      });
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: "Failed to add item to cart",
        error: error.message,
      });
    }
  }

  async update({ auth, request, response }: HttpContext) {
    await cartItemUpdateValidator.validate({
      id: request.param("id"),
      ...request.body(),
    });
    try {
      const user = auth.user!;
      const cartBody = request.body() as CartItemUpdate;
      cartBody.userId = user.id;
      cartBody.id = request.param("id");

      await this.cartItemModel.updateCartItem(cartBody);
      return response.ok({
        success: true,
      });
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: "Failed to update cart item",
        error: error.message,
      });
    }
  }

  async checkout({ auth, request, response }: HttpContext) {
    await request.validateUsing(checkoutCartValidator);
    try {
      const user = auth.user!;
      const cartItemIds = request.input("cartItemIds");
      const couponCode = request.input("couponCode");

      const options: CheckoutRequest = {
        userId: user.id,
        cartItemIds,
        couponCode,
      };

      await this.checkoutService.startCart(options);
      const checkoutResponse = this.checkoutService.getCheckout();
      return response.created({
        success: true,
        message: "Checkout successful",
        data: checkoutResponse,
      });
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: "Failed to retrieve checkout",
        error: error.message,
      });
    }
  }
}
