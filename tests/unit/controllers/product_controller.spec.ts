import { test } from '@japa/runner'
import sinon from 'sinon'
import Product from '#models/product/product'

// Assuming your controller is in this path - adjust as needed
import ProductController from '#controllers/product/product_controller'

test.group('ProductController - index', (group) => {
  let controller: ProductController
  let mockRequest: {input: sinon.SinonStub}
  let mockResponse: any
  let mockQuery
  let mockProduct
  let productQueryStub

  group.setup(() => {
    // Setup controller instance
    controller = new ProductController()
  })

  group.each.setup(() => {
    // Create mock request object
    mockRequest = {
      input: sinon.stub()
    }

    // Create mock response object
    mockResponse = {
      ok: sinon.stub().returns({ success: true }),
      internalServerError: sinon.stub().returns({ success: false })
    }

    // Create mock query builder
    mockQuery = {
      preload: sinon.stub().returnsThis(),
      select: sinon.stub().returnsThis(),
      where: sinon.stub().returnsThis(),
      orWhere: sinon.stub().returnsThis(),
      orderBy: sinon.stub().returnsThis(),
      paginate: sinon.stub()
    }

    // Create mock product model
    mockProduct = {
      serialize: sinon.stub().returns({
        data: [
          { id: 1, name: 'Product 1', description: 'Description 1' },
          { id: 2, name: 'Product 2', description: 'Description 2' }
        ]
      }),
      total: 50,
      currentPage: 1,
      perPage: 10,
      lastPage: 5
    }

    // Stub Product.query()
    productQueryStub = sinon.stub(Product, 'query').returns(mockQuery)
  })

  group.each.teardown(() => {
    sinon.restore()
  })

  test('should return products with default pagination', async ({ assert }) => {
    // Setup
    mockRequest.input.withArgs('page', 1).returns(1)
    mockRequest.input.withArgs('limit', 10).returns(10)
    mockRequest.input.withArgs('search').returns(undefined)
    mockRequest.input.withArgs('category_id').returns(undefined)
    mockRequest.input.withArgs('sort_by', 'created_at').returns('created_at')
    mockRequest.input.withArgs('sort_order', 'desc').returns('desc')

    mockQuery.paginate.resolves(mockProduct)

    // Execute
    await controller.index({ request: mockRequest, response: mockResponse })

    // Assert
    assert.isTrue(productQueryStub.calledOnce)
    assert.isTrue(mockQuery.preload.calledThrice)
    assert.isTrue(mockQuery.preload.calledWith('categories'))
    assert.isTrue(mockQuery.preload.calledWith('variations'))
    assert.isTrue(mockQuery.preload.calledWith('extras'))
    assert.isTrue(mockQuery.select.calledWith('*'))
    assert.isTrue(mockQuery.orderBy.calledWith('created_at', 'desc'))
    assert.isTrue(mockQuery.paginate.calledWith(1, 10))
    assert.isTrue(mockResponse.ok.calledOnce)

    const responseCall = mockResponse.ok.getCall(0)
    assert.deepEqual(responseCall.args[0], {
      success: true,
      data: mockProduct.serialize(),
      meta: {
        total: mockProduct.total,
        page: mockProduct.currentPage,
        limit: mockProduct.perPage,
        pages: mockProduct.lastPage
      }
    })
  })

  test('should apply search filter when search term provided', async ({ assert }) => {
    // Setup
    mockRequest.input.withArgs('page', 1).returns(1)
    mockRequest.input.withArgs('limit', 10).returns(10)
    mockRequest.input.withArgs('search').returns('test product')
    mockRequest.input.withArgs('category_id').returns(undefined)
    mockRequest.input.withArgs('sort_by', 'created_at').returns('created_at')
    mockRequest.input.withArgs('sort_order', 'desc').returns('desc')

    mockQuery.paginate.resolves(mockProduct)

    // Execute
    await controller.index({ request: mockRequest, response: mockResponse })

    // Assert
    assert.isTrue(mockQuery.where.calledWith('name', 'ILIKE', '%test product%'))
    assert.isTrue(mockQuery.orWhere.calledWith('description', 'ILIKE', '%test product%'))
    assert.isTrue(mockResponse.ok.calledOnce)
  })

  test('should apply category filter when category_id provided', async ({ assert }) => {
    // Setup
    mockRequest.input.withArgs('page', 1).returns(1)
    mockRequest.input.withArgs('limit', 10).returns(10)
    mockRequest.input.withArgs('search').returns(undefined)
    mockRequest.input.withArgs('category_id').returns(5)
    mockRequest.input.withArgs('sort_by', 'created_at').returns('created_at')
    mockRequest.input.withArgs('sort_order', 'desc').returns('desc')

    mockQuery.paginate.resolves(mockProduct)

    // Execute
    await controller.index({ request: mockRequest, response: mockResponse })

    // Assert
    assert.isTrue(mockQuery.where.calledWith('category_id', 5))
    assert.isTrue(mockResponse.ok.calledOnce)
  })

  test('should apply custom sorting when sort parameters provided', async ({ assert }) => {
    // Setup
    mockRequest.input.withArgs('page', 1).returns(1)
    mockRequest.input.withArgs('limit', 10).returns(10)
    mockRequest.input.withArgs('search').returns(undefined)
    mockRequest.input.withArgs('category_id').returns(undefined)
    mockRequest.input.withArgs('sort_by', 'created_at').returns('name')
    mockRequest.input.withArgs('sort_order', 'desc').returns('asc')

    mockQuery.paginate.resolves(mockProduct)

    // Execute
    await controller.index({ request: mockRequest, response: mockResponse })

    // Assert
    assert.isTrue(mockQuery.orderBy.calledWith('name', 'asc'))
    assert.isTrue(mockResponse.ok.calledOnce)
  })

  test('should apply custom pagination when page and limit provided', async ({ assert }) => {
    // Setup
    mockRequest.input.withArgs('page', 1).returns(3)
    mockRequest.input.withArgs('limit', 10).returns(20)
    mockRequest.input.withArgs('search').returns(undefined)
    mockRequest.input.withArgs('category_id').returns(undefined)
    mockRequest.input.withArgs('sort_by', 'created_at').returns('created_at')
    mockRequest.input.withArgs('sort_order', 'desc').returns('desc')

    mockQuery.paginate.resolves(mockProduct)

    // Execute
    await controller.index({ request: mockRequest, response: mockResponse })

    // Assert
    assert.isTrue(mockQuery.paginate.calledWith(3, 20))
    assert.isTrue(mockResponse.ok.calledOnce)
  })

  test('should apply both search and category filters when both provided', async ({ assert }) => {
    // Setup
    mockRequest.input.withArgs('page', 1).returns(1)
    mockRequest.input.withArgs('limit', 10).returns(10)
    mockRequest.input.withArgs('search').returns('laptop')
    mockRequest.input.withArgs('category_id').returns(3)
    mockRequest.input.withArgs('sort_by', 'created_at').returns('created_at')
    mockRequest.input.withArgs('sort_order', 'desc').returns('desc')

    mockQuery.paginate.resolves(mockProduct)

    // Execute
    await controller.index({ request: mockRequest, response: mockResponse })

    // Assert
    assert.isTrue(mockQuery.where.calledWith('name', 'ILIKE', '%laptop%'))
    assert.isTrue(mockQuery.orWhere.calledWith('description', 'ILIKE', '%laptop%'))
    assert.isTrue(mockQuery.where.calledWith('category_id', 3))
    assert.isTrue(mockResponse.ok.calledOnce)
  })

  test('should handle database errors gracefully', async ({ assert }) => {
    // Setup
    mockRequest.input.withArgs('page', 1).returns(1)
    mockRequest.input.withArgs('limit', 10).returns(10)
    mockRequest.input.withArgs('search').returns(undefined)
    mockRequest.input.withArgs('category_id').returns(undefined)
    mockRequest.input.withArgs('sort_by', 'created_at').returns('created_at')
    mockRequest.input.withArgs('sort_order', 'desc').returns('desc')

    const errorMessage = 'Database connection failed'
    mockQuery.paginate.rejects(new Error(errorMessage))

    // Execute
    await controller.index({ request: mockRequest, response: mockResponse })

    // Assert
    assert.isTrue(mockResponse.internalServerError.calledOnce)
    
    const errorResponseCall = mockResponse.internalServerError.getCall(0)
    assert.deepEqual(errorResponseCall.args[0], {
      success: false,
      message: 'Failed to fetch products',
      error: errorMessage
    })
  })

  test('should handle empty search results', async ({ assert }) => {
    // Setup
    mockRequest.input.withArgs('page', 1).returns(1)
    mockRequest.input.withArgs('limit', 10).returns(10)
    mockRequest.input.withArgs('search').returns('nonexistent product')
    mockRequest.input.withArgs('category_id').returns(undefined)
    mockRequest.input.withArgs('sort_by', 'created_at').returns('created_at')
    mockRequest.input.withArgs('sort_order', 'desc').returns('desc')

    const emptyResult = {
      serialize: sinon.stub().returns({ data: [] }),
      total: 0,
      currentPage: 1,
      perPage: 10,
      lastPage: 1
    }

    mockQuery.paginate.resolves(emptyResult)

    // Execute
    await controller.index({ request: mockRequest, response: mockResponse })

    // Assert
    assert.isTrue(mockResponse.ok.calledOnce)
    
    const responseCall = mockResponse.ok.getCall(0)
    assert.equal(responseCall.args[0].meta.total, 0)
    assert.deepEqual(responseCall.args[0].data, { data: [] })
  })

  test('should preload all required relationships', async ({ assert }) => {
    // Setup
    mockRequest.input.withArgs('page', 1).returns(1)
    mockRequest.input.withArgs('limit', 10).returns(10)
    mockRequest.input.withArgs('search').returns(undefined)
    mockRequest.input.withArgs('category_id').returns(undefined)
    mockRequest.input.withArgs('sort_by', 'created_at').returns('created_at')
    mockRequest.input.withArgs('sort_order', 'desc').returns('desc')

    mockQuery.paginate.resolves(mockProduct)

    // Execute
    await controller.index({ request: mockRequest, response: mockResponse })

    // Assert - Check that all preloads are called in the correct order
    assert.isTrue(mockQuery.preload.calledThrice)
    assert.isTrue(mockQuery.preload.getCall(0).calledWith('categories'))
    assert.isTrue(mockQuery.preload.getCall(1).calledWith('variations'))
    assert.isTrue(mockQuery.preload.getCall(2).calledWith('extras'))
  })
})

// --------------------------------
test.group('ProductController - show', (group) => {
  let controller
  let mockParams
  let mockResponse
  let mockQuery
  let mockProduct
  let productQueryStub

  group.setup(() => {
    // Setup controller instance
    controller = new ProductController()
  })

  group.each.setup(() => {
    // Create mock params object
    mockParams = {
      id: 1
    }

    // Create mock response object
    mockResponse = {
      ok: sinon.stub().returns({ success: true }),
      notFound: sinon.stub().returns({ success: false })
    }

    // Create mock query builder
    mockQuery = {
      where: sinon.stub().returnsThis(),
      preload: sinon.stub().returnsThis(),
      firstOrFail: sinon.stub()
    }

    // Create mock product model
    mockProduct = {
      serialize: sinon.stub().returns({
        id: 1,
        name: 'Test Product',
        description: 'Test Description',
        categories: [],
        variations: [],
        extras: []
      })
    }

    // Stub Product.query()
    productQueryStub = sinon.stub(Product, 'query').returns(mockQuery)
  })

  group.each.teardown(() => {
    sinon.restore()
  })

  test('should return product when found', async ({ assert }) => {
    // Setup
    mockQuery.firstOrFail.resolves(mockProduct)

    // Execute
    await controller.show({ params: mockParams, response: mockResponse })

    // Assert
    assert.isTrue(productQueryStub.calledOnce)
    assert.isTrue(mockQuery.where.calledWith('id', 1))
    assert.isTrue(mockQuery.preload.calledThrice)
    assert.isTrue(mockQuery.preload.calledWith('categories'))
    assert.isTrue(mockQuery.preload.calledWith('variations'))
    assert.isTrue(mockQuery.preload.calledWith('extras'))
    assert.isTrue(mockQuery.firstOrFail.calledOnce)
    assert.isTrue(mockResponse.ok.calledOnce)

    const responseCall = mockResponse.ok.getCall(0)
    assert.deepEqual(responseCall.args[0], {
      success: true,
      data: mockProduct.serialize()
    })
  })

  test('should return 404 when product not found', async ({ assert }) => {
    // Setup - simulate ModelNotFoundException
    const notFoundError = new Error('Product not found')
    mockQuery.firstOrFail.rejects(notFoundError)

    // Execute
    await controller.show({ params: mockParams, response: mockResponse })

    // Assert
    assert.isTrue(productQueryStub.calledOnce)
    assert.isTrue(mockQuery.where.calledWith('id', 1))
    assert.isTrue(mockQuery.preload.calledThrice)
    assert.isTrue(mockQuery.firstOrFail.calledOnce)
    assert.isTrue(mockResponse.notFound.calledOnce)

    const responseCall = mockResponse.notFound.getCall(0)
    assert.deepEqual(responseCall.args[0], {
      success: false,
      message: 'Product not found'
    })
  })

  test('should handle invalid product ID', async ({ assert }) => {
    // Setup
    mockParams.id = 'invalid-id'
    const invalidIdError = new Error('Invalid ID')
    mockQuery.firstOrFail.rejects(invalidIdError)

    // Execute
    await controller.show({ params: mockParams, response: mockResponse })

    // Assert
    assert.isTrue(mockQuery.where.calledWith('id', 'invalid-id'))
    assert.isTrue(mockResponse.notFound.calledOnce)
  })

  test('should handle database errors gracefully', async ({ assert }) => {
    // Setup
    const databaseError = new Error('Database connection failed')
    mockQuery.firstOrFail.rejects(databaseError)

    // Execute
    await controller.show({ params: mockParams, response: mockResponse })

    // Assert
    assert.isTrue(mockResponse.notFound.calledOnce)
    
    const responseCall = mockResponse.notFound.getCall(0)
    assert.deepEqual(responseCall.args[0], {
      success: false,
      message: 'Product not found'
    })
  })

  // test('should preload all required relationships in correct order', async ({ assert }) => {
  //   // Setup
  //   mockQuery.firstOrFail.resolves(mockProduct)

  //   // Execute
  //   await controller.show({ params: mockParams, response: mockResponse })

  //   // Assert - Check that all preloads are called in the correct order
  //   assert.isTrue(mockQuery.preload.calledThrice)
  //   assert.isTrue(mockQuery.preload.getCall(0).calledWith('categories'))
  //   assert.isTrue(mockQuery.preload.getCall(1).calledWith('variations'))
  //   assert.isTrue(mockQuery.preload.getCall(2).calledWith('extras'))
  // })

  // test('should query with correct product ID', async ({ assert }) => {
  //   // Setup
  //   mockParams.id = 42
  //   mockQuery.firstOrFail.resolves(mockProduct)

  //   // Execute
  //   await controller.show({ params: mockParams, response: mockResponse })

  //   // Assert
  //   assert.isTrue(mockQuery.where.calledWith('id', 42))
  //   assert.isTrue(mockResponse.ok.calledOnce)
  // })

  // test('should serialize product data correctly', async ({ assert }) => {
  //   // Setup
  //   const expectedSerializedData = {
  //     id: 1,
  //     name: 'Test Product',
  //     description: 'Test Description',
  //     categories: [{ id: 1, name: 'Category 1' }],
  //     variations: [{ id: 1, name: 'Variation 1' }],
  //     extras: [{ id: 1, name: 'Extra 1' }]
  //   }
    
  //   mockProduct.serialize.returns(expectedSerializedData)
  //   mockQuery.firstOrFail.resolves(mockProduct)

  //   // Execute
  //   await controller.show({ params: mockParams, response: mockResponse })

  //   // Assert
  //   assert.isTrue(mockProduct.serialize.calledOnce)
    
  //   const responseCall = mockResponse.ok.getCall(0)
  //   assert.deepEqual(responseCall.args[0].data, expectedSerializedData)
  // })
})