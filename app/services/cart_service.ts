import CartItem from "#models/user/cart_item";
import Coupon from "#models/user/coupon";
import Order from "#models/user/order";
import OrderItem from "#models/user/order_item";

import { DateTime } from "luxon";

import StockService from "#services/stock_service";

import { Decimal } from "decimal.js";
import { TransactionClientContract } from "@adonisjs/lucid/types/database";
import { inject } from "@adonisjs/core";
import { StockHandler } from "#types/stock";

// get checkout, get cart. in  get checkout, the stocks will be checked.
@inject()
export default class CartService {
  private readonly coupon: typeof Coupon;
  private readonly cartItem: typeof CartItem;

  private checkoutCartItems: CartItem[];
  private checkoutCartTotal: Decimal;
  private couponInstance: Coupon | null;
  private errors: string[];

  constructor(private stockService: StockService) {
    this.cartItem = CartItem;
    this.coupon = Coupon;

    this.checkoutCartItems = [];
    this.checkoutCartTotal = new Decimal("0");
    this.couponInstance = null;
    this.errors = [];
  }

  private async setCheckoutCart(options: {
    userId: number;
    cartItemIds?: number[];
  }): Promise<void> {
    if (options.cartItemIds) {
      const checkoutCartItems = await this.cartItem
        .query()
        .where("userId", options.userId)
        .whereIn("id", options.cartItemIds)
        .preload("variation", (query) => {
          query.preload("product");
          query.preload("recipe");
        })
        .preload("cartItemExtras", (query) => {
          query.preload("extra");
        })
        .exec();

      this.checkoutCartItems = checkoutCartItems;
      return;
    }

    const checkoutCartItems = await this.cartItem
      .query()
      .where("userId", options.userId)
      .preload("variation", (query) => {
        query.preload("product");
      })
      .preload("cartItemExtras", (query) => {
        query.preload("extra");
      })
      .exec();
    this.checkoutCartItems = checkoutCartItems;
  }

  private setCheckoutCartPrice(): void {
    let checkoutCartTotal = new Decimal("0");

    for (const cartItem of this.checkoutCartItems) {
      const cartItemTotal = cartItem.calcCartItemTotalPrice();
      checkoutCartTotal = checkoutCartTotal.add(cartItemTotal);
    }

    this.checkoutCartTotal = checkoutCartTotal;
  }

  private async setCoupon(couponCode: string): Promise<void> {
    let couponInstance = await this.coupon.findByCode(couponCode);
    couponInstance.apply(this.checkoutCartTotal);
    this.couponInstance = couponInstance;
  }

  // GETTERS
  public getCheckoutCartTotal(): Decimal {
    if (this.couponInstance === null) return this.checkoutCartTotal;

    const total = this.checkoutCartTotal.sub(this.couponInstance.discount);
    return total;
  }

  public getCheckoutCart(): {
    items: CartItem[];
    totalPrice: string;
    totalToPay: string;
    couponId: number | undefined;
    couponDiscount: string | undefined;
    ingredients: StockHandler[];
  } {
    const result = {
      items: this.checkoutCartItems,
      totalPrice: this.checkoutCartTotal.toString(),
      couponId: this.couponInstance?.id || undefined,
      couponDiscount: this.couponInstance?.discount.toString() || undefined,
      totalToPay: this.getCheckoutCartTotal().toString(),
      ingredients: this.stockService.getIngredientsStack(),
    };
    return result;
  }

  public getCheckoutCartResponse() {
    const result = {
      checkoutCart: this.checkoutCartItems,
      checkoutCartTotal: this.checkoutCartTotal,
      couponDiscount: this.couponInstance?.discount || null,

      total: this.getCheckoutCartTotal(),
    };
    return result;
  }

  // START
  public async startCheckout(options: {
    userId: number;
    cartItemIds: number[];
    couponCode?: string;
  }): Promise<void> {
    await this.setCheckoutCart({ ...options });

    await this.stockService.start(this.checkoutCartItems);

    // const hasStocks = this.stockService.hasStocks();
    // if (!hasStocks) throw new Error("Not enough stock");

    this.setCheckoutCartPrice();

    if (options.couponCode) {
      try {
        await this.setCoupon(options.couponCode);
      } catch (error) {
        this.errors.push(error.message);
      }
    }
  }

  public async startCart(userId: number): Promise<void> {
    await this.setCheckoutCart({ userId });
    this.setCheckoutCartPrice();
  }

  public async finishCheckout(trx: TransactionClientContract): Promise<void> {
    const promises = [];
    promises.push(this.stockService.reserveStocks());

    const deleteCartItems = this.checkoutCartItems.map((cartItem) =>
      cartItem.delete(),
    );
    promises.push(...deleteCartItems);

    if (this.couponInstance) promises.push(this.couponInstance.use(trx));

    await Promise.all(promises);
  }

  public getFormatedStocks(): StockHandler[] {
    return this.stockService.getIngredientsStack();
  }
}
