import { DateTime } from "luxon";
import { BaseModel, column, belongsTo, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";

import User from "#models/user/user";
import Variation from "#models/product/variation";
import CartItemExtra from "#models/user/cart_item_extra";
import { Decimal } from "decimal.js";

import type { CartItemStore, CartItemUpdate } from "#types/requests/post";

export default class CartItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare userId: number;

  @column()
  declare quantity: number;

  @column()
  declare variationId: number;

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;

  @belongsTo(() => Variation)
  declare variation: BelongsTo<typeof Variation>;

  @hasMany(() => CartItemExtra)
  declare cartItemExtras: HasMany<typeof CartItemExtra>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  declare total: Decimal;

  //CREATE A CONSTRAINT FOR CART_ITEM_EXTRA.EXTRA_ID BELONGS TO VARIATION.PRODUCT_ID

  // getters ======================================================
  public static async getCartItemsByUserId(
    userId: number,
  ): Promise<CartItem[]> {
    const checkoutCartItems = await CartItem.query()
      .where("userId", userId)
      .preload("variation", (query) => {
        query.preload("product");
      })
      .preload("cartItemExtras", (query) => {
        query.preload("extra");
      })
      .exec();

    if (!checkoutCartItems) {
      throw new Error("Cart items not found");
    }

    return checkoutCartItems;
  }

  public static async getCartItems(options: {
    userId: number;
    cartItemIds?: number[];
  }): Promise<CartItem[]> {
    let query = CartItem.query().where("userId", options.userId);

    if (options.cartItemIds) {
      query = query
        .whereIn("id", options.cartItemIds)
        .preload("variation", (query) => {
          query.preload("product");
          query.preload("recipe");
        });
    } else {
      query = query.preload("variation", (query) => {
        query.preload("product");
      });
    }

    query = query.preload("cartItemExtras", (query) => {
      query.preload("extra");
    });

    const cartItems = await query.exec();

    if (!cartItems) {
      throw new Error("Cart items not found");
    }

    return cartItems;
  }
  // calculation ======================================================
  private calcVariationPrice(): Decimal {
    const productPrice = new Decimal(this.variation.product.price);
    const variationPrice = productPrice.mul(this.variation.price);
    return variationPrice;
  }

  private calcCartItemExtrasPrice(): Decimal {
    let extrasPrice = new Decimal("0");
    for (const cartItemExtra of this.cartItemExtras) {
      const extraPrice = new Decimal(cartItemExtra.extra.price);
      const cartItemExtraPrice = extraPrice.mul(cartItemExtra.quantity);
      extrasPrice = extrasPrice.add(cartItemExtraPrice);
    }
    return extrasPrice;
  }

  public calcCartItemTotalPrice(): Decimal {
    let cartItemTotal = new Decimal("0");
    const variationPrice = this.calcVariationPrice();
    cartItemTotal = cartItemTotal.add(variationPrice);

    if (this.cartItemExtras.length > 0) {
      const extrasPrice = this.calcCartItemExtrasPrice();
      cartItemTotal = cartItemTotal.add(extrasPrice);
    }

    cartItemTotal = cartItemTotal.mul(this.quantity);
    this.total = cartItemTotal;

    return cartItemTotal;
  }

  //validation ========================================================
  private static async validateExtraConstraint(cartItem: {
    variationId: number;
    cartItemExtras: { extraId: number }[];
  }) {
    const findVariation = await Variation.query()
      .where("id", cartItem.variationId)
      .preload("product", (query) => query.preload("extras"))
      .firstOrFail();

    if (!findVariation) {
      throw new Error("Variation not found");
    }

    const productExtrasIds = findVariation.product.extras.map(
      (extra) => extra.id,
    );

    for (const cartItemExtra of cartItem.cartItemExtras) {
      if (!productExtrasIds.includes(cartItemExtra.extraId)) {
        throw new Error("Extra not found in the product");
      }
    }
  }
  // setters ======================================================
  public static async storeCartItem(cartItemPost: CartItemStore) {
    await this.validateExtraConstraint(cartItemPost);

    const createdCartItem = await CartItem.create({
      userId: cartItemPost.userId,
      variationId: cartItemPost.variationId,
      quantity: cartItemPost.quantity,
    });

    for (const cartItemExtra of cartItemPost.cartItemExtras) {
      await CartItemExtra.create({
        cartItemId: createdCartItem.id,
        extraId: cartItemExtra.extraId,
        quantity: cartItemExtra.quantity,
      });
    }
  }

  public static async updateCartItem(cartItemPost: CartItemUpdate) {
    await this.validateExtraConstraint(cartItemPost);

    const findCartItem = await CartItem.findOrFail(cartItemPost.id);
    findCartItem.quantity = cartItemPost.quantity;
    findCartItem.save();

    await CartItemExtra.query().where("cartItemId", findCartItem.id).delete();

    for (const cartItemExtra of cartItemPost.cartItemExtras) {
      await CartItemExtra.create({
        cartItemId: findCartItem.id,
        extraId: cartItemExtra.extraId,
        quantity: cartItemExtra.quantity,
      });
    }
  }
}
