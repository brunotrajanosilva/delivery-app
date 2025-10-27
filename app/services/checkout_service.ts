import CartItem from "#models/user/cart_item";
import Coupon from "#models/user/coupon";

import StockService from "#services/stock_service";

import { Decimal } from "decimal.js";
import { TransactionClientContract } from "@adonisjs/lucid/types/database";
import { inject } from "@adonisjs/core";
import { StockHandler } from "#types/stock";

import CartService from "./cart_service.js";

@inject()
export default class CheckoutService extends CartService {
  private readonly couponModel: typeof Coupon;
  private couponInstance: Coupon | null;
  private errors: string[] = [];

  constructor(
    private stockService: StockService,
    __couponModel?: typeof Coupon,
  ) {
    super();
    this.couponModel = __couponModel || Coupon;
    this.couponInstance = null;
  }

  private async setCoupon(couponCode: string): Promise<void> {
    let couponInstance = await this.couponModel.findByCode(couponCode);
    couponInstance.apply(this.cartTotal);
    this.couponInstance = couponInstance;
  }

  // GETTERS
  public getCheckoutTotal(): Decimal {
    if (this.couponInstance === null) return this.cartTotal;

    const total = this.cartTotal.sub(this.couponInstance.discount);
    return total;
  }

  public getCheckout(): {
    items: CartItem[];
    totalPrice: string;
    totalToPay: string;
    couponId: number | undefined;
    couponDiscount: string | undefined;
    stocks: StockHandler[];
  } {
    const result = {
      items: this.cartItems,
      totalPrice: this.cartTotal.toString(),
      totalToPay: this.getCheckoutTotal().toString(),
      couponId: this.couponInstance?.id || undefined,
      couponDiscount: this.couponInstance?.discount.toString() || undefined,
      stocks: this.stockService.getIngredientsStack(),
    };
    return result;
  }

  public override async startCart(options: {
    userId: number;
    cartItemIds?: number[];
    couponCode?: string;
  }): Promise<void> {
    await super.startCart(options);

    if (options.couponCode) {
      try {
        await this.setCoupon(options.couponCode);
      } catch (error) {
        this.errors.push(error.message);
      }
    }

    await this.stockService.start(this.cartItems);
    const hasStocks = this.stockService.hasStocks();
    if (!hasStocks) throw new Error("Not enough stock");
  }

  public async finishCheckout(trx: TransactionClientContract): Promise<void> {
    const promises = [];
    promises.push(this.stockService.reserveStocks(trx));

    const deleteCartItems = this.cartItems.map((cartItem) => {
      cartItem.useTransaction(trx);
      cartItem.delete();
    });
    promises.push(...deleteCartItems);

    if (this.couponInstance) promises.push(this.couponInstance.use(trx));

    await Promise.all(promises);
  }

  public getIngredientsStocks(): StockHandler[] {
    return this.stockService.getIngredientsStack();
  }
}
