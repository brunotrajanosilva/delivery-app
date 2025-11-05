import CheckoutService from "./checkout_service.js";
import GatewayManager from "#modules/payment/services/gateway_manager";

import { DateTime } from "luxon";
// models
import Order from "#models/user/order";
import OrderItem from "#models/user/order_item";
import CartItem from "#models/user/cart_item";

// db
import db from "@adonisjs/lucid/services/db";
import { inject } from "@adonisjs/core";
import { OrderCreationRequest } from "#types/requests/order";
import { OrderItemDetails } from "#types/order";

@inject()
export default class OrderCreationService {
  private orderModel: typeof Order;

  constructor(
    private cartService: CheckoutService,
    private gatewayManager: GatewayManager,
    __orderModel: typeof Order,
  ) {
    this.orderModel = __orderModel || Order;
  }

  public async process(payload: OrderCreationRequest): Promise<number> {
    const created = await db.transaction(async (trx) => {
      await this.cartService.startCart({ ...payload });

      const checkoutCart = this.cartService.getCheckout();
      const formatOrder = this.formatOrder(checkoutCart);

      formatOrder.paymentGateway = payload.paymentGateway;
      formatOrder.userId = payload.userId;

      const order = await this.orderModel.create(
        { ...formatOrder },
        {
          client: trx,
        },
      );

      const formatOrderItems = this.formatOrderItems(checkoutCart.items);

      await order
        .related("items")
        .createMany(formatOrderItems as any, { client: trx });

      // payment
      const gateway = this.gatewayManager.use(payload.paymentGateway);
      const payment = await gateway.createPayment(
        order.uuid,
        parseFloat(formatOrder.totalToPay as string),
        "BRL",
      );

      order.paymentId = payment;
      await order.save();
      await this.cartService.finishCheckout(trx);
      return order;
    });

    return created.id;
  }

  private formatOrder(
    checkoutCart: ReturnType<CheckoutService["getCheckout"]>,
  ): Partial<Order> {
    const expirationDate = DateTime.now().plus({ minutes: 30 });
    return {
      totalPrice: checkoutCart.totalPrice,
      totalToPay: checkoutCart.totalToPay,
      couponId: checkoutCart.couponId,
      couponDiscount: checkoutCart.couponDiscount,
      stocks: checkoutCart.stocks,
      expirationDate: expirationDate,
      paymentStatus: "pending",
    };
  }
  private formatOrderItems(
    checkoutCartItems: CartItem[],
  ): Partial<OrderItem>[] {
    const formatOrderItems = [];

    for (const cartItem of checkoutCartItems) {
      const details: OrderItemDetails = {
        product: {
          id: cartItem.variation.product.id,
          name: cartItem.variation.product.name,
          price: cartItem.variation.product.price,
          description: cartItem.variation.product.description,
        },
        variation: {
          id: cartItem.variation.id,
          name: cartItem.variation.name,
          price: cartItem.variation.price,
          isRecipe: cartItem.variation.isRecipe,
        },
        extras: cartItem.cartItemExtras.map((cartExtra) => {
          return {
            id: cartExtra.extra.id,
            name: cartExtra.extra.name,
            price: cartExtra.extra.price,
            quantity: cartExtra.quantity,
          };
        }),
      };

      const cartItemFormated: Partial<OrderItem> = {
        variationId: cartItem.variation.id,
        details: details,
        quantity: cartItem.quantity,
        total: cartItem.total.toString(),
      };

      formatOrderItems.push(cartItemFormated);
    }
    return formatOrderItems;
  }
}
