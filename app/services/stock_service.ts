import Stock from '#models/stock/stock'
import CartService from '#services/cart_service'
import { DateTime } from 'luxon'
import { StockHandler } from '#types/stock'
import { parse } from 'path'

// cancel order not paid when there is no stock. that occurs because the system permits more than available stock to be ordered

/* 
Order creation
before: reserve stocks
create: Order queue, create payment
after: payment success: discount reserve; payment fail: return reserve; 

*/
// Order placed: get all ingredients, replace them from available stock to reserve stock;
// when order is cancelled or expire time to reserve: get all ingredients, replace them from reserve stock to available stock;
// when order is payed before expire: discount from reserve;
// when order is payed after expire: discount from available;

// if low stock, notify

export default class StockService {
  private readonly stockModel: typeof Stock
  private ingredientsStack: StockHandler[]
  private checkoutStocks: Stock[]
  // workflow
  //   inject models: Stock, Recipe, Extra,
  constructor(stockModel: typeof Stock) {
    this.stockModel = stockModel
    this.ingredientsStack = []
    this.checkoutStocks = []
  }

  private setIngredientsStack(checkoutCart: CartService['checkoutCart']): void {
    const cartItems = checkoutCart
    const ingredientsMap = new Map<string, number>() //Map<{ itemId: number; itemType: string }, number>()

    for (const cartItem of cartItems) {
      if (cartItem.variation.isRecipe) {
        const key = `${cartItem.variation.id}:variation` //{ itemId: cartItem.variation.id, itemType: 'variation' }
        const keyQuantity = ingredientsMap.get(key) || 0

        ingredientsMap.set(key, keyQuantity + 1 * cartItem.quantity)
        continue
      }

      for (const recipeItem of cartItem.variation.recipe) {
        const key = `${recipeItem.ingredientId}:ingredient`
        const keyQuantity = ingredientsMap.get(key) || 0

        ingredientsMap.set(key, keyQuantity + recipeItem.quantity * cartItem.quantity)
      }

      // ADD EXTRAS
      for (const cartItemExtra of cartItem.cartItemExtras) {
        const key = `${cartItemExtra.extra.ingredientId}:ingredient`
        const keyQuantity = ingredientsMap.get(key) || 0

        ingredientsMap.set(
          key,
          keyQuantity + cartItemExtra.extra.quantity * cartItemExtra.quantity * cartItem.quantity
        )
      }
    }

    for (const [key, quantity] of ingredientsMap) {
      const [itemId, itemType] = key.split(':')
      this.ingredientsStack.push({ itemId: parseInt(itemId), itemType, quantity })
    }
  }

  private async setQueryStocks(): Promise<void> {
    const stockIngredientsIds = []
    const stockVariationsIds = []

    for (const ingredient of this.ingredientsStack) {
      if (ingredient.itemType === 'ingredient') {
        stockIngredientsIds.push(ingredient.itemId)
      } else {
        stockVariationsIds.push(ingredient.itemId)
      }
    }

    const stocks = await this.stockModel
      .query()
      .where('itemType', 'ingredient')
      .whereIn('itemId', stockIngredientsIds)
      .orWhere('itemType', 'variation')
      .whereIn('itemId', stockVariationsIds)

    this.checkoutStocks = stocks
  }

  public async start(checkoutCart: CartService['checkoutCart']) {
    this.setIngredientsStack(checkoutCart)
    await this.setQueryStocks()
  }

  public hasStocks(): boolean {
    for (const { itemId, itemType, quantity } of this.ingredientsStack) {
      const stock = this.checkoutStocks.find(
        (stock) => stock.itemId === itemId && stock.itemType === itemType
      )
      if (!stock) throw new Error('stock not found')

      if (stock.available < quantity) {
        return false
      }
    }
    return true
  }

  public getFormatedStocks(): StockHandler[] {
    return this.ingredientsStack
  }

  public async reserveStocks(): Promise<void> {
    const now = DateTime.local()

    for (const stock of this.ingredientsStack) {
      await this.stockModel
        .query()
        .where('itemId', stock.itemId)
        .where('itemType', stock.itemType)
        .decrement('available', stock.quantity)
        .increment('reserved', stock.quantity)
      // .update('created_at', now.toJSDate())
    }
  }
  //   AFTER ORDER CREATION. THERE IS NO MORE CART. THE STOCKS WILL BE QUERIED FROM THE ORDER
  public async refundStocks(orderStocks: StockHandler[]): Promise<void> {
    for (const stock of orderStocks) {
      await this.stockModel
        .query()
        .where('itemId', stock.itemId)
        .where('itemType', stock.itemType)
        .decrement('reserved', stock.quantity)
        .increment('available', stock.quantity)
    }
  }
  public async discountStocks(orderStocks: StockHandler[]): Promise<void> {
    for (const stock of orderStocks) {
      await this.stockModel
        .query()
        .where('itemId', stock.itemId)
        .where('itemType', stock.itemType)
        .decrement('reserved', stock.quantity)
    }
  }

  //   public setStocks(): void {
  //     this.aggRecipeIngredients()

  //     for (const [key, quantity] of this.ingredientsMap) {
  //       this.stockModel
  //         .query()
  //         .where('itemType', key.itemType)
  //         .where('itemId', key.itemId)
  //         .where('quantity', '>=', quantity)
  //         .get()
  //     }

  // const ingredientIds = Array.from(this.ingredientsMap.keys())
  //   .filter((key) => key.itemType === 'ingredient')
  //   .map((key) => key.itemId)
  // const variationIds = Array.from(this.ingredientsMap.keys())
  //   .filter((key) => key.itemType === 'variation')
  //   .map((key) => key.itemId)

  // const stocks = this.stockModel
  //   .query()
  //   .where('itemType', 'ingredient')
  //   .where('itemId', 'IN', ingredientIds)
  //   .orWhere('itemType', 'variation')
  //   .where('itemId', 'IN', variationIds)
  //   .get()

  // this.checkoutStocks = stocks
  //   }

  // TRANSFORM ORDER INPUT, GET RECIPE STOCK ITENS AND DELETE THEM

  // get all the ingredients of a list of cartItems or orderItems
  /* private async aggregateItemsIgredients(
    items: CartItem[] | OrderItem[]
  ): Promise<Map<string, number>> {
    const ingredientsMap = new Map<string, number>()

    for (const item of items) {
      const relations = await item.getThisRelations()
      const { variation, extras } = relations.details

      if (variation.isRecipe) {
        const variationIngredients = await this.getVariationIngredients(variation.id, item.quantity)

        for (const ingredient of variationIngredients) {
          const { ingredientId, quantity } = ingredient
          const idString = `ingredient-${ingredientId}`

          ingredientsMap.set(idString, ingredientsMap.get(idString) || 0 + quantity)
        }
      }

      if (!variation.isRecipe) {
        const idString = `variation-${variation.id}`
        ingredientsMap.set(idString, (ingredientsMap.get(idString) || 0) + item.quantity)
      }

      //   extras
      if (extras.length > 0) {
        const extraIngredients = await this.getExtraIngredients(extras, item.quantity)

        for (const ingredient of extraIngredients) {
          const { ingredientId, quantity } = ingredient
          const idString = `ingredient-${ingredientId}`

          ingredientsMap.set(idString, (ingredientsMap.get(idString) || 0) + quantity)
        }
      }
    }

    return ingredientsMap
  }

  private async getVariationIngredients(variation_id: number, item_quantity: number) {
    const recipeItems = await this.recipeModel.query().where('variation_id', variation_id)

    if (recipeItems.length === 0) throw new Error('Variation does not have a recipe')

    const ingredients = []

    for (const recipeItem of recipeItems) {
      const ingredientId = recipeItem.ingredientId
      const quantity = recipeItem.quantity * item_quantity

      ingredients.push({ ingredientId, quantity })
    }

    return ingredients
  }

  private async getExtraIngredients(
    extras: { id: number; quantity: number; extraObj: Extra }[],
    item_quantity: number
  ) {
    const ingredients = []

    for (const extra of extras) {
      const extraObj = extra.extraObj

      const ingredientId = extraObj.ingredientId
      const quantity = extraObj.quantity * extra.quantity * item_quantity

      ingredients.push({ ingredientId, quantity })
    }
    return ingredients
  }

  private async getItemsStocksFromAggregate(map: Map<string, number>): Promise<ItemsStocks> {
    const itemsStocks = new Map<Stock, number>()

    for (const [idString, quantity] of map.entries()) {
      const [id, type] = idString.split('-')
      const stock = await this.stockModel
        .query()
        .where('itemId', id)
        .where('itemType', type)
        .first()

      if (!stock) throw new Error(`No stock found for ingredient ${idString}`)

      itemsStocks.set(stock, quantity)
    }

    return itemsStocks
  }

  public async getItemsStocks(items: CartItem[] | OrderItem[]): Promise<ItemsStocks> {
    const aggregated = await this.aggregateItemsIgredients(items)
    const itemsStocks = await this.getItemsStocksFromAggregate(aggregated)

    return itemsStocks
  }
 */
  //   Order creation
  /* public hasStocks(items: ItemsStocks): boolean {
    let result = true

    for (const [stock, quantity] of items) {
      if (stock.available < quantity) {
        result = false
        break
      }
    }
    return result
  }

  public async reserveStocks(items: ItemsStocks, trx: TransactionClientContract) {
    for (const [stock, quantity] of items) {
      stock.useTransaction(trx)
      stock.available -= quantity
      stock.reserved += quantity
      await stock.save()
    }
  }

  public async refundStocks(items: ItemsStocks) {
    const transaction = db.transaction(async (trx) => {
      for (const [stock, quantity] of items) {
        stock.useTransaction(trx)
        stock.available += quantity
        stock.reserved -= quantity
        await stock.save()
      }
    })
  }

  public async consumeStocks(items: ItemsStocks, expired: boolean) {
    const transaction = db.transaction(async (trx) => {
      for (const [stock, quantity] of items) {
        stock.useTransaction(trx)

        if (expired) {
          stock.available -= quantity
        }

        if (!expired) {
          stock.reserved -= quantity
        }
        await stock.save()
      }
    })
  } */

  // has stocks
  // reserve stocks
  // return reserved stocks
  // consume stocks

  /* private async discountStock(map: Map<number, number>, type: string) {
    for (const [ingredientId, quantity] of map.entries()) {
      const stock = await Stock.query()
        .where('itemId', ingredientId)
        .where('itemType', type)
        .first()

      if (!stock) {
        throw new Error(`No stock found for ingredient ID ${ingredientId}`)
      }

      await stock.subtractQuantity(quantity)
    }
  } */
}
