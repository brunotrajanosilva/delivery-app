import { test } from '@japa/runner'
import sinon from 'sinon'
import { DateTime } from 'luxon'

// Import the service to be tested
import DeliveryOrderService from "#modules/delivery/services/delivery_order_service"

// ------------------------------------
// Mock Implementations for Dependencies
// ------------------------------------

// Mock Location type for consistency
interface MockLocation {
  latitude: number,
  longitude: number,
  // Add other properties if your Location type has them
}

/**
 * Mock class for DeliveryOrder Model
 * We'll mock its static methods (like .query(), .create())
 * and instance methods (like .save(), .getLocation(), .getTimeToDelivery())
 */
class MockDeliveryOrder {
  public id: string
  public orderId: number
  // public location: string // Stored as stringified JSON
  public status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed'
  // public distance_km: number
  public deliveryWorkerId: string | null
  public assignedAt: DateTime | null

  // Constructor to create mock instances for tests
  constructor(data: {
    id?: string,
    orderId: number,
    // location: MockLocation,
    status?: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed',
    // distance_km: number,
    deliveryWorkerId?: string | null,
    assignedAt?: DateTime | null
  }) {
    this.id = data.id || `mock-order-${Math.random().toString(36).substring(2, 11)}`
    this.orderId = data.orderId
    // this.location = JSON.stringify(data.location)
    this.status = data.status || 'pending'
    // this.distance_km = data.distance_km
    this.deliveryWorkerId = data.deliveryWorkerId || null
    this.assignedAt = data.assignedAt || null
  }

  // Mock static methods
  public static create = sinon.stub()
  public static query = sinon.stub()
  // public static calcTimeDistance = (value: number) => {return value}//sinon.stub() // Static method on your original class

  // Mock instance methods
  public save = sinon.stub()//.resolves(this) // Simulate saving and returning the instance
  /* public getLocation(): MockLocation {
    return JSON.parse(this.location) as MockLocation
  } */
  public getTimePenalty(): number {
    return 0
  }

  // Additional mock query builder methods needed by your service
  public static queryBuilderStub = {
    where: sinon.stub(),//.returnsThis(),
    whereNot: sinon.stub().returnsThis(),
    first: sinon.stub(),
    orderBy: sinon.stub().returnsThis(), // Added for sorting
    // Add other methods like `select`, `join`, etc., if your service uses them
  }
}

/**
 * Mock class for DeliveryWorker Model
 */
class MockDeliveryWorker {
  public id: string
  public location: string // Stored as stringified JSON
  public status: 'available' | 'unavailable' | 'on_delivery'

  constructor(data: {
    id?: string,
    location?: MockLocation,
    status?: 'available' | 'unavailable' | 'on_delivery'
  }) {
    this.id = data.id || `mock-worker-${Math.random().toString(36).substring(2, 11)}`
    this.location = JSON.stringify(data.location)
    this.status = data.status || 'available'
  }

  // Mock static methods
  public static create = sinon.stub()
  public static query = sinon.stub()

  // Mock instance methods
  public save = sinon.stub()//.resolves(this)
  public getLocation(): MockLocation {
    return JSON.parse(this.location) as MockLocation
  }

  // Additional mock query builder methods
  public static queryBuilderStub = {
    where: sinon.stub().returnsThis(),
    whereNot: sinon.stub().returnsThis(),
    first: sinon.stub(),
    // Add other methods if needed
  }
}

/**
 * Mock class for LocationHelper
 */
class MockLocationHelper {
  public getGeoLocatorFromAddress = sinon.stub()
  public getDistanceKm = sinon.stub()
}

class MockRouteCalculatorService {
  public static getPermutations: sinon.SinonStub
}

// ------------------------------------
// Japa Test Suite
// ------------------------------------

test.group('DeliveryOrderService', (group) => {
  // Declare stubs for cleanup
  let deliveryOrderCreateStub: sinon.SinonStub
  let deliveryOrderQueryStub: sinon.SinonStub
  let deliveryOrderCalcTimeDistanceStub: sinon.SinonStub
  let deliveryOrderSaveStub: sinon.SinonStub
  let deliveryWorkerQueryStub: sinon.SinonStub
  let deliveryWorkerSaveStub: sinon.SinonStub
  let locationHelperGetGeoLocatorFromAddressStub: sinon.SinonStub
  let locationHelperGetDistanceKmStub: sinon.SinonStub
  let mockRouteCalculatorServicePermutation: sinon.SinonStub
  let mockWorker: MockDeliveryWorker
  let queryWhere: sinon.SinonStub

  // Reset mocks before each test
  group.each.setup(() => {
    // Reset all stubs on the Mock models/helper
    sinon.resetHistory() // Resets call history for all stubs

    // Re-stub static methods to return the query builder stub
    MockDeliveryOrder.query.returns(MockDeliveryOrder.queryBuilderStub)
    MockDeliveryWorker.query.returns(MockDeliveryWorker.queryBuilderStub)

    // Assign specific stubs for easier access and verification
    MockDeliveryOrder.create = sinon.stub()
    MockRouteCalculatorService.getPermutations = sinon.stub()
    deliveryOrderCreateStub = MockDeliveryOrder.create//sinon.stub(MockDeliveryOrder, 'create') //MockDeliveryOrder.create
    deliveryOrderQueryStub = MockDeliveryOrder.query
    queryWhere = MockDeliveryOrder.queryBuilderStub.where
    // deliveryOrderCalcTimeDistanceStub = MockDeliveryOrder.calcTimeDistance
    // deliveryOrderSaveStub = sinon.stub(MockDeliveryOrder.prototype, 'save') // Stub instance method
    deliveryWorkerQueryStub = MockDeliveryWorker.query
    // deliveryWorkerSaveStub = sinon.stub(MockDeliveryWorker.prototype, 'save') // Stub instance method
    locationHelperGetGeoLocatorFromAddressStub = new MockLocationHelper().getGeoLocatorFromAddress
    locationHelperGetDistanceKmStub = new MockLocationHelper().getDistanceKm
    mockWorker = new MockDeliveryWorker({})
    // mockRouteCalculatorServicePermutation = MockRouteCalculatorService.getPermutations
  })

  group.each.teardown(() => {
    sinon.restore() // Restores all stubs to their original methods
  })

  test('createDeliveryOrder should create a new delivery order', async ({ assert }) => {
    const orderId = 1
    const address = '123 Main St, Anytown'
    const mockStartLocation: MockLocation = { latitude: 37.7749, longitude: -122.4194}
    const mockAddressLocation: MockLocation = { latitude: 34.0522, longitude: -118.2437}
    const mockDistance = 100 // km

    locationHelperGetGeoLocatorFromAddressStub
      .withArgs('500 Terry A Francois Blvd, San Francisco, CA')
      .resolves(mockStartLocation)
    locationHelperGetGeoLocatorFromAddressStub
      .withArgs(address)
      .resolves(mockAddressLocation)

    locationHelperGetDistanceKmStub
      .withArgs(mockStartLocation, mockAddressLocation)
      .returns(mockDistance)

    const mockDeliveryOrderInstance = new MockDeliveryOrder({
      orderId,
    })
    deliveryOrderCreateStub.resolves(mockDeliveryOrderInstance)

    const deliveryOrderService = new DeliveryOrderService(
      MockDeliveryOrder as any, 
      MockDeliveryWorker as any,
      {
        getGeoLocatorFromAddress: locationHelperGetGeoLocatorFromAddressStub,
        getDistanceKm: locationHelperGetDistanceKmStub,
      } as any,
      MockRouteCalculatorService as any
    )

    const createdOrder = await deliveryOrderService.createDeliveryOrder(orderId, address)

    assert.exists(createdOrder)
    assert.equal(createdOrder.orderId, orderId)
    assert.equal(createdOrder.status, 'pending')

    assert.isTrue(locationHelperGetGeoLocatorFromAddressStub.calledTwice, 'getGeoLocatorFromAddress should be called twice')
    assert.isTrue(locationHelperGetDistanceKmStub.calledOnce, 'getDistanceKm should be called once')
    assert.isTrue(deliveryOrderCreateStub.calledOnceWith({
      orderId: orderId,
      location: JSON.stringify(mockAddressLocation),
      status: 'pending',
      distance_km: mockDistance,
    }), 'DeliveryOrder.create should be called with correct data')
    sinon.assert.notCalled(createdOrder.save)
    // assert.isTrue(createdOrder.save.notCalled, 'save should not be called by createDeliveryOrder logic')

    // error
    deliveryOrderCreateStub.resolves(null)

    await assert.rejects(() => deliveryOrderService.createDeliveryOrder(orderId, address), 'Error creating delivery order.')
    // save is called internally by .create() if the model is configured to do so, but the service itself doesn't call it again explicitly in this method.

  })

  test('should return null if no available delivery orders are found', async ({assert}) => {
    queryWhere.resolves([])

    const deliveryOrderService = new DeliveryOrderService(
      MockDeliveryOrder as any, // Cast to any to bypass strict type checking for mocks
      MockDeliveryWorker as any,
      {
        getGeoLocatorFromAddress: locationHelperGetGeoLocatorFromAddressStub,
        getDistanceKm: locationHelperGetDistanceKmStub,
      } as any,
      MockRouteCalculatorService as any
    )

    const assignedStops = await deliveryOrderService.assignDeliveryOrders(mockWorker as any)

    // Assert
    assert.isNull(assignedStops)
    sinon.assert.calledOnce(deliveryOrderQueryStub)
    sinon.assert.calledWith(queryWhere, 'status', 'pending')
    // Ensure no orders were attempted to be saved
    sinon.assert.notCalled(deliveryOrderCreateStub)
  });

  test('should assign 3 orders of all orders available', async ({assert}) => {

    const mockOrder1 = new MockDeliveryOrder({
      orderId: 1,
      status: 'pending',
    })
    const mockOrder2 = new MockDeliveryOrder({
      orderId: 22,
      status: 'pending',
    })
    const mockOrder3 = new MockDeliveryOrder({
      orderId: 3,
      status: 'pending',
    })
    const mockOrder4 = new MockDeliveryOrder({
      orderId: 4,
      status: 'pending',
    })

    queryWhere.resolves([mockOrder1, mockOrder2, mockOrder3, mockOrder4])

    MockRouteCalculatorService.getPermutations.returns([
      {permutation: [mockOrder2, mockOrder4, mockOrder3], penalty: 10},
      {permutation: ["b"], penalty: 15},
    ])


    const deliveryOrderService = new DeliveryOrderService(
      MockDeliveryOrder as any,
      MockDeliveryWorker as any,
      {
        getGeoLocatorFromAddress: locationHelperGetGeoLocatorFromAddressStub,
        getDistanceKm: locationHelperGetDistanceKmStub,
      } as any,
      MockRouteCalculatorService as any
    )

    const assignedStops = await deliveryOrderService.assignDeliveryOrders(mockWorker as any)

    assert.isNotNull(assignedStops)
    assert.equal(assignedStops?.permutation.length, 3)

    sinon.assert.calledOnce(mockOrder2.save)
    sinon.assert.calledOnce(mockOrder4.save)
    sinon.assert.calledOnce(mockOrder3.save)
    // sinon.assert.calledOnceWithExactly(mockOrder2.save, {})

  })

  test("should set maxStops to inferior number", async ({assert}) => {
    
    const mockOrder1 = new MockDeliveryOrder({
      orderId: 1,
      status: 'pending',
    })
    const mockOrder2 = new MockDeliveryOrder({
      orderId: 2,
      status: 'pending',
    })

    queryWhere.resolves([mockOrder1, mockOrder2])
    MockRouteCalculatorService.getPermutations.returns([
      {permutation: [mockOrder1, mockOrder2], penalty: 10},
      {permutation: ["b"], penalty: 15},
    ])

    const deliveryOrderService = new DeliveryOrderService(
      MockDeliveryOrder as any,
      MockDeliveryWorker as any,
      {
        getGeoLocatorFromAddress: locationHelperGetGeoLocatorFromAddressStub,
        getDistanceKm: locationHelperGetDistanceKmStub,
      } as any,
      MockRouteCalculatorService as any
    )

    const assignedStops = await deliveryOrderService.assignDeliveryOrders(mockWorker as any)

    sinon.assert.calledOnceWithExactly(MockRouteCalculatorService.getPermutations, [mockOrder1, mockOrder2], 2)
    assert.isNotNull(assignedStops)
    assert.equal(assignedStops?.permutation.length, 2)

  })
})

// test chuck length