import { test } from "@japa/runner";
import sinon from "sinon";
import StockService from "#services/stock_service";
import Stock from "#models/stock/stock";
import { DateTime } from "luxon";

test.group("StockService", (group) => {
  let sandbox: sinon.SinonSandbox;

  group.each.setup(() => {
    sandbox = sinon.createSandbox();
  });

  group.each.teardown(() => {
    sandbox.restore();
  });

  test("should set ingredients stack from cart items with recipe", async ({
    assert,
  }) => {
    const mockCartItems = [
      {
        quantity: 2,
        variation: {
          id: 1,
          isRecipe: false,
          recipe: [
            { ingredientId: 10, quantity: 3 },
            { ingredientId: 11, quantity: 1 },
          ],
        },
        cartItemExtras: [],
      },
    ];

    const stockService = new StockService();
    const mockStocks = [
      { itemId: 10, itemType: "ingredient", available: 100, reserved: 0 },
      { itemId: 11, itemType: "ingredient", available: 50, reserved: 0 },
    ];

    const queryStub = sandbox.stub(Stock, "query").returns({
      where: sandbox.stub().returnsThis(),
      orWhere: sandbox.stub().resolves(mockStocks),
    } as any);

    await stockService.start(mockCartItems as any);

    const ingredientsStack = stockService.getIngredientsStack();
    assert.lengthOf(ingredientsStack, 2);
    assert.equal(ingredientsStack[0].itemId, 10);
    assert.equal(ingredientsStack[0].quantity, 6); // 3 * 2
    assert.equal(ingredientsStack[1].itemId, 11);
    assert.equal(ingredientsStack[1].quantity, 2); // 1 * 2
  });

  test("should set ingredients stack with variation as recipe", async ({
    assert,
  }) => {
    const mockCartItems = [
      {
        quantity: 3,
        variation: {
          id: 5,
          isRecipe: true,
          recipe: [],
        },
        cartItemExtras: [],
      },
    ];

    const stockService = new StockService();
    const mockStocks = [
      { itemId: 5, itemType: "variation", available: 20, reserved: 0 },
    ];

    sandbox.stub(Stock, "query").returns({
      where: sandbox.stub().returnsThis(),
      orWhere: sandbox.stub().resolves(mockStocks),
    } as any);

    await stockService.start(mockCartItems as any);

    const ingredientsStack = stockService.getIngredientsStack();
    assert.lengthOf(ingredientsStack, 1);
    assert.equal(ingredientsStack[0].itemId, 5);
    assert.equal(ingredientsStack[0].itemType, "variation");
    assert.equal(ingredientsStack[0].quantity, 3);
  });

  test("should include cart item extras in ingredients stack", async ({
    assert,
  }) => {
    const mockCartItems = [
      {
        quantity: 2,
        variation: {
          id: 1,
          isRecipe: false,
          recipe: [{ ingredientId: 10, quantity: 1 }],
        },
        cartItemExtras: [
          {
            quantity: 1,
            extra: {
              ingredientId: 15,
              quantity: 2,
            },
          },
        ],
      },
    ];

    const stockService = new StockService();
    const mockStocks = [
      { itemId: 10, itemType: "ingredient", available: 100, reserved: 0 },
      { itemId: 15, itemType: "ingredient", available: 50, reserved: 0 },
    ];

    sandbox.stub(Stock, "query").returns({
      where: sandbox.stub().returnsThis(),
      orWhere: sandbox.stub().resolves(mockStocks),
    } as any);

    await stockService.start(mockCartItems as any);

    const ingredientsStack = stockService.getIngredientsStack();
    assert.lengthOf(ingredientsStack, 2);

    const extraIngredient = ingredientsStack.find((item) => item.itemId === 15);
    assert.exists(extraIngredient);
    assert.equal(extraIngredient!.quantity, 4); // 2 * 1 * 2
  });

  test("should throw error when stock not found", async ({ assert }) => {
    const mockCartItems = [
      {
        quantity: 1,
        variation: {
          id: 1,
          isRecipe: false,
          recipe: [{ ingredientId: 99, quantity: 1 }],
        },
        cartItemExtras: [],
      },
    ];

    const stockService = new StockService();
    const mockStocks: any[] = [];

    sandbox.stub(Stock, "query").returns({
      where: sandbox.stub().returnsThis(),
      orWhere: sandbox.stub().resolves(mockStocks),
    } as any);

    await assert.rejects(
      () => stockService.start(mockCartItems as any),
      "stock not found",
    );
  });

  test("should throw error when insufficient stock", async ({ assert }) => {
    const mockCartItems = [
      {
        quantity: 10,
        variation: {
          id: 1,
          isRecipe: false,
          recipe: [{ ingredientId: 10, quantity: 5 }],
        },
        cartItemExtras: [],
      },
    ];

    const stockService = new StockService();
    const mockStocks = [
      { itemId: 10, itemType: "ingredient", available: 20, reserved: 0 },
    ];

    sandbox.stub(Stock, "query").returns({
      where: sandbox.stub().returnsThis(),
      orWhere: sandbox.stub().resolves(mockStocks),
    } as any);

    await assert.rejects(
      () => stockService.start(mockCartItems as any),
      "Insufficient stock for ingredient ID 10.",
    );
  });

  test("should reserve stocks successfully", async ({ assert }) => {
    const orderStocks = [{ itemId: 10, itemType: "ingredient", quantity: 5 }];

    const stockService = new StockService();
    const mockTrx = {} as any;

    const queryStub = sandbox.stub().returns({
      where: sandbox.stub().returnsThis(),
      decrement: sandbox.stub().returnsThis(),
      increment: sandbox.stub().returnsThis(),
      update: sandbox.stub().resolves(),
    });

    sandbox.stub(Stock, "query").returns(queryStub() as any);

    await stockService.reserveStocks(mockTrx, orderStocks as any);
    const firstWhere = queryStub().where.getCall(0);
    const secondWhere = queryStub().where.getCall(1);

    assert.isTrue(queryStub().update.calledOnce);
    assert.isTrue(firstWhere.calledWith("itemId", 10));
    assert.isTrue(secondWhere.calledWith("itemType", "ingredient"));
    assert.isTrue(queryStub().decrement.calledWith("available", 5));
    assert.isTrue(queryStub().increment.calledWith("reserved", 5));
  });

  test("should refund stocks successfully", async ({ assert }) => {
    const orderStocks = [{ itemId: 10, itemType: "ingredient", quantity: 5 }];

    const stockService = new StockService();
    const mockTrx = {} as any;

    const queryStub = sandbox.stub().returns({
      where: sandbox.stub().returnsThis(),
      decrement: sandbox.stub().returnsThis(),
      increment: sandbox.stub().returnsThis(),
      update: sandbox.stub().resolves(),
    });

    sandbox.stub(Stock, "query").returns(queryStub() as any);

    await stockService.refundStocks(mockTrx, orderStocks as any);
    const firstWhere = queryStub().where.getCall(0);
    const secondWhere = queryStub().where.getCall(1);

    assert.isTrue(queryStub().update.calledOnce);
    assert.isTrue(firstWhere.calledWith("itemId", 10));
    assert.isTrue(secondWhere.calledWith("itemType", "ingredient"));
    assert.isTrue(queryStub().decrement.calledWith("reserved", 5));
    assert.isTrue(queryStub().increment.calledWith("available", 5));
  });

  test("should discount stocks successfully", async ({ assert }) => {
    const orderStocks = [{ itemId: 10, itemType: "ingredient", quantity: 5 }];

    const stockService = new StockService();
    const mockTrx = {} as any;

    const queryStub = sandbox.stub().returns({
      where: sandbox.stub().returnsThis(),
      decrement: sandbox.stub().returnsThis(),
      update: sandbox.stub().resolves(),
    });

    sandbox.stub(Stock, "query").returns(queryStub() as any);

    await stockService.discountStocks(mockTrx, orderStocks as any);
    const firstWhere = queryStub().where.getCall(0);
    const secondWhere = queryStub().where.getCall(1);

    assert.isTrue(queryStub().update.calledOnce);
    assert.isTrue(firstWhere.calledWith("itemId", 10));
    assert.isTrue(secondWhere.calledWith("itemType", "ingredient"));
    assert.isTrue(queryStub().decrement.calledWith("reserved", 5));
  });

  test("should allow custom stock model injection", async ({ assert }) => {
    class CustomStock extends Stock {}

    const stockService = new StockService(CustomStock);

    const mockCartItems = [
      {
        quantity: 1,
        variation: {
          id: 1,
          isRecipe: false,
          recipe: [{ ingredientId: 10, quantity: 1 }],
        },
        cartItemExtras: [],
      },
    ];

    const mockStocks = [
      { itemId: 10, itemType: "ingredient", available: 100, reserved: 0 },
    ];

    sandbox.stub(CustomStock, "query").returns({
      where: sandbox.stub().returnsThis(),
      orWhere: sandbox.stub().resolves(mockStocks),
    } as any);

    await stockService.start(mockCartItems as any);

    const ingredientsStack = stockService.getIngredientsStack();
    assert.lengthOf(ingredientsStack, 1);
  });
});
