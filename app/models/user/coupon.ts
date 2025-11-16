import { DateTime } from "luxon";
import { BaseModel, column, belongsTo } from "@adonisjs/lucid/orm";
// import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { Decimal } from "decimal.js";

// import Category from '#models/product/category'

import { TransactionClientContract } from "@adonisjs/lucid/types/database";

export default class Coupon extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare code: string;

  @column()
  declare discountType: "percentage" | "flat";

  @column()
  declare discountValue: string;

  @column()
  declare startDate: Date;

  @column()
  declare endDate: Date;

  @column()
  declare quantity: number;

  @column()
  declare minimumPurchase: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  // not a field. only for cache the discount
  declare discount: Decimal;

  /********* Methods *********/
  // errors should not raise an exception
  // workflow: validate and apply. when order is created, call use()

  static async findByCode(code: string): Promise<Coupon> {
    const coupon = await this.query().where("code", code).first();
    if (!coupon) {
      throw new Error("coupon not found");
    }
    return coupon;
  }

  private isExpired(): boolean {
    const now = new Date();
    return now > new Date(this.endDate);
  }

  private isUsed(): boolean {
    return this.quantity != null && this.quantity <= 0;
  }

  private isUnderMinimumPurchase(total: Decimal): boolean {
    const minimumPurchase = new Decimal(this.minimumPurchase);
    return total.lessThan(minimumPurchase);
  }

  // logic
  private validateCoupon(total: Decimal): void {
    if (this.isExpired()) {
      throw new Error("coupon expired");
    }

    if (this.isUsed()) {
      throw new Error("coupon usage limit reached");
    }

    if (this.isUnderMinimumPurchase(total)) {
      throw new Error("minimum purchase not met");
    }

    if (
      this.discountType === "percentage" &&
      Decimal(this.discountValue).greaterThanOrEqualTo(1)
    ) {
      throw new Error("invalid discount value");
    }

    if (this.discountType === "flat" && Decimal(this.discountValue).equals(0)) {
      throw new Error("invalid discount value");
    }
  }

  private calcDiscount(total: Decimal): Decimal {
    if (this.discountType === "percentage") {
      const discountPercentage = new Decimal(this.discountValue);
      return total.mul(discountPercentage);
    }

    if (this.discountType === "flat") {
      const discountFlat = new Decimal(this.discountValue);
      return discountFlat;
    }

    throw new Error("invalid discount type");
  }

  public async use(trx?: TransactionClientContract): Promise<void> {
    if (this.quantity != null) {
      this.quantity -= 1;
    }

    if (trx) {
      this.useTransaction(trx);
    }

    await this.save();
  }

  public apply(total: Decimal): void {
    // CHANGED RETURN
    this.validateCoupon(total);
    const discount = this.calcDiscount(total);
    this.discount = discount;
  }

  public static async refund(id: number): Promise<void> {
    await this.query().where("id", id).increment("quantity", 1);
  }
}
