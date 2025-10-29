import Stock from "#models/stock/stock";
import CartService from "#services/cart_service";
import { DateTime } from "luxon";
import { StockHandler } from "#types/stock";

import { TransactionClientContract } from "@adonisjs/lucid/types/database";

// Order creation
// before: check sufficient stocks
// creation: reserve stocks;
// after: payment success: discount reserve; payment fail: return reserve;

export default class StockService {
  private ingredientsStack: StockHandler[];
  private readonly stockModel: typeof Stock;
  constructor(__stockModel?: typeof Stock) {
    this.ingredientsStack = [];
    this.stockModel = __stockModel || Stock;
  }

  // needs a refactor
  private setIngredientsStack(checkoutCart: CartService["cartItems"]): void {
    const cartItems = checkoutCart;
    const ingredientsMap = new Map<string, number>();

    for (const cartItem of cartItems) {
      if (cartItem.variation.isRecipe) {
        const key = `${cartItem.variation.id}:variation`;
        const keyQuantity = ingredientsMap.get(key) || 0;

        ingredientsMap.set(key, keyQuantity + cartItem.quantity);
        continue;
      }

      for (const recipeItem of cartItem.variation.recipe) {
        const key = `${recipeItem.ingredientId}:ingredient`;
        const keyQuantity = ingredientsMap.get(key) || 0;

        ingredientsMap.set(
          key,
          keyQuantity + recipeItem.quantity * cartItem.quantity,
        );
      }

      // ADD EXTRAS
      for (const cartItemExtra of cartItem.cartItemExtras) {
        const key = `${cartItemExtra.extra.ingredientId}:ingredient`;
        const keyQuantity = ingredientsMap.get(key) || 0;

        ingredientsMap.set(
          key,
          keyQuantity +
            cartItemExtra.extra.quantity *
              cartItemExtra.quantity *
              cartItem.quantity,
        );
      }
    }

    for (const [key, quantity] of ingredientsMap) {
      const [itemId, itemType] = key.split(":");
      this.ingredientsStack.push({
        itemId: parseInt(itemId),
        itemType,
        quantity,
      });
    }
  }

  public getIngredientsStack(): StockHandler[] {
    return this.ingredientsStack;
  }

  private async queryStocks(): Promise<Stock[]> {
    const stockIngredientsIds: number[] = [];
    const stockVariationsIds: number[] = [];

    for (const ingredient of this.ingredientsStack) {
      if (ingredient.itemType === "ingredient") {
        stockIngredientsIds.push(ingredient.itemId);
      } else {
        stockVariationsIds.push(ingredient.itemId);
      }
    }

    const stocks = await this.stockModel
      .query()
      .where((query) => {
        query
          .where("itemType", "ingredient")
          .whereIn("id", stockIngredientsIds);
      })
      .orWhere((query) => {
        query.where("itemType", "variation").whereIn("id", stockVariationsIds);
      });

    return stocks;
  }

  private hasSufficientStocks(stocks: Stock[]): void {
    for (const { itemId, itemType, quantity } of this.ingredientsStack) {
      const stock = stocks.find((stock) => {
        return stock.itemId == itemId && stock.itemType == itemType;
      });
      if (!stock) throw new Error("stock not found");

      if (stock.available < quantity) {
        throw new Error(`Insufficient stock for ${itemType} ID ${itemId}.`);
      }
    }
  }

  public async start(checkoutCart: CartService["cartItems"]): Promise<void> {
    this.setIngredientsStack(checkoutCart);
    const findStocks = await this.queryStocks();
    this.hasSufficientStocks(findStocks);
  }

  public async reserveStocks(
    trx: TransactionClientContract,
    orderStocks: StockHandler[] = this.ingredientsStack,
  ): Promise<void> {
    const now = DateTime.local();
    for (const stock of orderStocks) {
      await this.stockModel
        .query({ client: trx })
        .where("itemId", stock.itemId)
        .where("itemType", stock.itemType)
        .decrement("available", stock.quantity)
        .increment("reserved", stock.quantity)
        .update("updated_at", now);
    }
  }
  //   AFTER ORDER CREATION. THERE IS NO MORE CART. THE STOCKS WILL BE QUERIED FROM THE ORDER
  public async refundStocks(
    trx: TransactionClientContract,
    orderStocks: StockHandler[],
  ): Promise<void> {
    const now = DateTime.local();
    for (const stock of orderStocks) {
      await this.stockModel
        .query({ client: trx })
        .where("itemId", stock.itemId)
        .where("itemType", stock.itemType)
        .decrement("reserved", stock.quantity)
        .increment("available", stock.quantity)
        .update("updated_at", now);
    }
  }
  public async discountStocks(
    trx: TransactionClientContract,
    orderStocks: StockHandler[],
  ): Promise<void> {
    const now = DateTime.local();
    for (const stock of orderStocks) {
      await this.stockModel
        .query({ client: trx })
        .where("itemId", stock.itemId)
        .where("itemType", stock.itemType)
        .decrement("reserved", stock.quantity)
        .update("updated_at", now);
    }
  }
}
