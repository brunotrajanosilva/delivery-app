import { test } from '@japa/runner'
import sinon from 'sinon'
import StockService from '#services/stock_service'
import Stock from '#models/stock/stock'
import CartService from '#services/cart_service'
import { StockHandler } from '#types/stock'

test.group('StockService', (group) => {
  let stockService: StockService
  let stockModelMock: sinon.SinonStubbedInstance<typeof Stock>
  let queryBuilderMock: any

  group.setup(() => {
    // Create query builder mock
    // queryBuilderMock = {
    //   where: sinon.stub().returnsThis(),
    //   whereIn: sinon.stub().returnsThis(),
    //   orWhere: sinon.stub().returnsThis(),
    //   decrement: sinon.stub().returnsThis(),
    //   increment: sinon.stub().returnsThis(),
    //   update: sinon.stub().returnsThis(),
    // }
    // // Create Stock model mock
    // stockModelMock = {
    //   query: sinon.stub().returns(queryBuilderMock),
    // } as any
    // stockService = new StockService(stockModelMock as any)
  })

  group.teardown(() => {
    sinon.restore()
  })

  group.each.setup(() => {
    // sinon.resetHistory()
    // sinon.resetBehavior()
    sinon.restore()

    queryBuilderMock = {
      where: sinon.stub().returnsThis(),
      whereIn: sinon.stub().returnsThis(),
      orWhere: sinon.stub().returnsThis(),
      decrement: sinon.stub().returnsThis(),
      increment: sinon.stub().returnsThis(),
      update: sinon.stub().returnsThis(),
    }

    // Create Stock model mock
    stockModelMock = {
      query: sinon.stub().returns(queryBuilderMock),
    } as any

    stockService = new StockService(stockModelMock as any)

    // Reset query builder mock
    // queryBuilderMock.where.returnsThis()
    // queryBuilderMock.whereIn.returnsThis()
    // queryBuilderMock.orWhere.returnsThis()
    // queryBuilderMock.decrement.returnsThis()
    // queryBuilderMock.increment.returnsThis()
    // queryBuilderMock.update.returnsThis()
  })

  test('should initialize with empty stacks', async ({ assert }) => {
    const formattedStocks = stockService.getFormatedStocks()
    assert.deepEqual(formattedStocks, [])
  })

  test('should process cart with recipe variations correctly', async ({ assert }) => {
    // Mock cart with recipe variation
    const mockCart: CartService['checkoutCart'] = [
      {
        quantity: 2,
        variation: {
          id: 1,
          isRecipe: false,
          recipe: [
            { ingredientId: 10, quantity: 10 },
            { ingredientId: 11, quantity: 20 },
          ],
        },
        cartItemExtras: [],
      } as any,
    ]

    // Mock stocks response
    const mockStocks = [
      { itemId: 10, itemType: 'ingredient', available: 100, reserved: 0 },
      { itemId: 11, itemType: 'ingredient', available: 200, reserved: 0 },
    ]
    queryBuilderMock.where.returnsThis()
    queryBuilderMock.whereIn.returnsThis()
    queryBuilderMock.orWhere.returnsThis()

    // Mock the query execution to return stocks
    const executePromise = Promise.resolve(mockStocks)
    Object.assign(queryBuilderMock, executePromise)
    queryBuilderMock.then = executePromise.then.bind(executePromise)
    queryBuilderMock.catch = executePromise.catch.bind(executePromise)

    await stockService.start(mockCart)

    const formattedStocks = stockService.getFormatedStocks()

    assert.equal(formattedStocks.length, 2)
    assert.deepEqual(formattedStocks, [
      { itemId: 10, itemType: 'ingredient', quantity: 20 },
      { itemId: 11, itemType: 'ingredient', quantity: 40 }, // 2 * 2 quantity
    ])
  })

  test('should process cart with non-recipe variations correctly', async ({ assert }) => {
    const mockCart: CartService['checkoutCart'] = [
      {
        quantity: 3,
        variation: {
          id: 5,
          isRecipe: true,
          recipe: [],
        },
        cartItemExtras: [],
      },
    ] as any

    const mockStocks = [{ itemId: 5, itemType: 'variation', available: 10, reserved: 0 }]

    const executePromise = Promise.resolve(mockStocks)
    Object.assign(queryBuilderMock, executePromise)
    queryBuilderMock.then = executePromise.then.bind(executePromise)
    queryBuilderMock.catch = executePromise.catch.bind(executePromise)

    await stockService.start(mockCart)

    const formattedStocks = stockService.getFormatedStocks()

    assert.equal(formattedStocks.length, 1)
    assert.deepEqual(formattedStocks, [{ itemId: 5, itemType: 'variation', quantity: 3 }])
  })

  test('should process cart with extras correctly', async ({ assert }) => {
    const cartItemExtra = { extra: { ingredientId: 10, quantity: 10 }, quantity: 2 }
    const mockCart: CartService['checkoutCart'] = [
      {
        quantity: 3,
        variation: {
          id: 5,
          isRecipe: false,
          recipe: [],
        },
        cartItemExtras: [cartItemExtra],
      },
    ] as any

    const mockStocks = [{ itemId: 10, itemType: 'ingredient', available: 100, reserved: 0 }]

    const executePromise = Promise.resolve(mockStocks)
    Object.assign(queryBuilderMock, executePromise)
    queryBuilderMock.then = executePromise.then.bind(executePromise)
    queryBuilderMock.catch = executePromise.catch.bind(executePromise)

    await stockService.start(mockCart)

    const formattedStocks = stockService.getFormatedStocks()

    assert.equal(formattedStocks.length, 1)
    assert.deepEqual(formattedStocks, [{ itemId: 10, itemType: 'ingredient', quantity: 60 }])
  })

  test('should return true when stocks are available', async ({ assert }) => {
    const mockCart: CartService['checkoutCart'] = [
      {
        quantity: 1,
        variation: {
          id: 1,
          isRecipe: false,
          recipe: [{ ingredientId: 10, quantity: 1 }],
        },
        cartItemExtras: [],
      },
    ] as any

    const mockStocks = [{ itemId: 10, itemType: 'ingredient', available: 5, reserved: 0 }]

    const executePromise = Promise.resolve(mockStocks)
    Object.assign(queryBuilderMock, executePromise)
    queryBuilderMock.then = executePromise.then.bind(executePromise)
    queryBuilderMock.catch = executePromise.catch.bind(executePromise)

    await stockService.start(mockCart)

    const hasStock = stockService.hasStocks()
    assert.isTrue(hasStock)
  })

  test('should return false when stocks are insufficient', async ({ assert }) => {
    const mockCart: CartService['checkoutCart'] = [
      {
        quantity: 5,
        variation: {
          id: 1,
          isRecipe: false,
          recipe: [{ ingredientId: 10, quantity: 1 }],
        },
        cartItemExtras: [],
      },
    ] as any

    const mockStocks = [
      { itemId: 10, itemType: 'ingredient', available: 3, reserved: 0 }, // Not enough stock
    ]

    const executePromise = Promise.resolve(mockStocks)
    Object.assign(queryBuilderMock, executePromise)
    queryBuilderMock.then = executePromise.then.bind(executePromise)
    queryBuilderMock.catch = executePromise.catch.bind(executePromise)

    await stockService.start(mockCart)

    const hasStock = stockService.hasStocks()
    assert.isFalse(hasStock)
  })

  test('should throw error when stock is not found', async ({ assert }) => {
    const mockCart: CartService['checkoutCart'] = [
      {
        quantity: 1,
        variation: {
          id: 1,
          isRecipe: false,
          recipe: [{ ingredientId: 10, quantity: 1 }],
        },
        cartItemExtras: [],
      },
    ] as any

    // Empty stocks array - stock not found
    const mockStocks: Stock[] = []

    const executePromise = Promise.resolve(mockStocks)
    Object.assign(queryBuilderMock, executePromise)
    queryBuilderMock.then = executePromise.then.bind(executePromise)
    queryBuilderMock.catch = executePromise.catch.bind(executePromise)

    await stockService.start(mockCart)

    assert.throws(() => stockService.hasStocks(), 'stock not found')
  })

  test('should reserve stocks correctly', async ({ assert }) => {
    const mockCart: CartService['checkoutCart'] = [
      {
        quantity: 2,
        variation: {
          id: 1,
          isRecipe: false,
          recipe: [
            { ingredientId: 10, quantity: 1 },
            { ingredientId: 11, quantity: 1 },
          ],
        },
        cartItemExtras: [],
      },
    ] as any

    const mockStocks = [
      { itemId: 10, itemType: 'ingredient', available: 10, reserved: 0 },
      { itemId: 11, itemType: 'ingredient', available: 10, reserved: 0 },
    ]

    const executePromise = Promise.resolve(mockStocks)
    Object.assign(queryBuilderMock, executePromise)
    queryBuilderMock.then = executePromise.then.bind(executePromise)
    queryBuilderMock.catch = executePromise.catch.bind(executePromise)

    await stockService.start(mockCart)
    await stockService.reserveStocks()

    // Verify that the correct queries were made
    assert.equal(stockModelMock.query.callCount, 3) // 1 for start, 2 for reserve

    // Check that decrement and increment were called
    assert.equal(queryBuilderMock.decrement.callCount, 2)
    assert.equal(queryBuilderMock.increment.callCount, 2)

    // Verify the calls were made with correct parameters
    assert.isTrue(queryBuilderMock.decrement.calledWith('available', 2))
    assert.isTrue(queryBuilderMock.increment.calledWith('reserved', 2))
  })

  test('should refund stocks correctly', async ({ assert }) => {
    const orderStocks: StockHandler[] = [
      { itemId: 10, itemType: 'ingredient', quantity: 2 },
      { itemId: 11, itemType: 'ingredient', quantity: 3 },
    ]

    await stockService.refundStocks(orderStocks)

    // Verify that the correct number of queries were made
    assert.equal(stockModelMock.query.callCount, 2)

    // Check that decrement and increment were called for refunding
    assert.equal(queryBuilderMock.decrement.callCount, 2)
    assert.equal(queryBuilderMock.increment.callCount, 2)

    // Verify the calls were made with correct parameters
    assert.isTrue(queryBuilderMock.decrement.calledWith('reserved', 2))
    assert.isTrue(queryBuilderMock.decrement.calledWith('reserved', 3))
    assert.isTrue(queryBuilderMock.increment.calledWith('available', 2))
    assert.isTrue(queryBuilderMock.increment.calledWith('available', 3))
  })

  test('should discount stocks correctly', async ({ assert }) => {
    const orderStocks: StockHandler[] = [
      { itemId: 10, itemType: 'ingredient', quantity: 2 },
      { itemId: 11, itemType: 'ingredient', quantity: 3 },
    ]

    await stockService.discountStocks(orderStocks)

    // Verify that the correct number of queries were made
    assert.equal(stockModelMock.query.callCount, 2)

    // Check that only decrement was called (no increment for discount)
    assert.equal(queryBuilderMock.decrement.callCount, 2)
    assert.equal(queryBuilderMock.increment.callCount, 0)

    // Verify the calls were made with correct parameters
    assert.isTrue(queryBuilderMock.decrement.calledWith('reserved', 2))
    assert.isTrue(queryBuilderMock.decrement.calledWith('reserved', 3))
  })

  test('should handle mixed cart items with ingredients and variations', async ({ assert }) => {
    const mockCart: CartService['checkoutCart'] = [
      {
        quantity: 1,
        variation: {
          id: 1,
          isRecipe: false,
          recipe: [{ ingredientId: 10, quantity: 2 }],
        },
        cartItemExtras: [],
      },
      {
        quantity: 2,
        variation: {
          id: 5,
          isRecipe: true,
          recipe: [],
        },
        cartItemExtras: [],
      },
    ] as any

    const mockStocks = [
      { itemId: 10, itemType: 'ingredient', available: 10, reserved: 0 },
      { itemId: 5, itemType: 'variation', available: 5, reserved: 0 },
    ]

    const executePromise = Promise.resolve(mockStocks)
    Object.assign(queryBuilderMock, executePromise)
    queryBuilderMock.then = executePromise.then.bind(executePromise)
    queryBuilderMock.catch = executePromise.catch.bind(executePromise)

    await stockService.start(mockCart)

    const formattedStocks = stockService.getFormatedStocks()

    assert.equal(formattedStocks.length, 2)
    assert.deepEqual(formattedStocks, [
      { itemId: 10, itemType: 'ingredient', quantity: 2 },
      { itemId: 5, itemType: 'variation', quantity: 2 },
    ])

    const hasStock = stockService.hasStocks()
    assert.isTrue(hasStock)
  })

  test('should accumulate quantities for same ingredients in cart', async ({ assert }) => {
    const mockCart: CartService['checkoutCart'] = [
      {
        quantity: 2,
        variation: {
          id: 1,
          isRecipe: false,
          recipe: [{ ingredientId: 10, quantity: 1 }],
        },
        cartItemExtras: [],
      },
      {
        quantity: 3,
        variation: {
          id: 2,
          isRecipe: false,
          recipe: [
            { ingredientId: 10, quantity: 1 }, // Same ingredient
          ],
        },
        cartItemExtras: [],
      },
    ] as any

    const mockStocks = [{ itemId: 10, itemType: 'ingredient', available: 10, reserved: 0 }]

    const executePromise = Promise.resolve(mockStocks)
    Object.assign(queryBuilderMock, executePromise)
    queryBuilderMock.then = executePromise.then.bind(executePromise)
    queryBuilderMock.catch = executePromise.catch.bind(executePromise)

    await stockService.start(mockCart)

    const formattedStocks = stockService.getFormatedStocks()
    console.log(formattedStocks)

    assert.equal(formattedStocks.length, 1)
    assert.deepEqual(formattedStocks, [
      { itemId: 10, itemType: 'ingredient', quantity: 5 }, // 2 + 3 accumulated
    ])
  })
})
