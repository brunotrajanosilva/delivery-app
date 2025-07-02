import { test } from '@japa/runner'
import sinon from 'sinon'
import { Decimal } from 'decimal.js'
import CartService from '#services/cart_service'
// import CartItem from '#models/user/cart_item'
// import Product from '#models/product/product'
// import Variation from '#models/product/variation'
// import Extra from '#models/product/extra'
import { CartItemPayload } from '#types/requests/cart_item'
import { mock } from 'node:test'

test.group('CartService', (group) => {

    class MockCartItem{
        public static getRelations: sinon.SinonStub
        public static create: sinon.SinonStub
        
        public static queryStub = {
            where: sinon.stub().returnsThis(),
            first: sinon.stub(),
            preload: sinon.stub()
        }

        public static query = sinon.stub().returns(MockCartItem.queryStub)
    }

    let cartService: CartService
    // let cartItemStub: sinon.SinonStubbedInstance<typeof CartItem>
    let mockUser: any
    let mockProduct: any
    let mockVariation: any
    let mockExtra: any

    group.each.setup(() => {
        sinon.resetHistory()

        // MockCartItem.query.reset()
        // MockCartItem.query.returns(MockCartItem.queryStub)
        // MockCartItem.queryStub.where.reset()
        MockCartItem.queryStub.where = sinon.stub().returnsThis()
        MockCartItem.queryStub.first = sinon.stub()
        MockCartItem.queryStub.preload = sinon.stub()

        MockCartItem.create = sinon.stub()
        MockCartItem.getRelations = sinon.stub()
        
        // Mock data
        mockUser = { id: 1 }
            mockProduct = { 
            id: 1, 
            price: '10.00',
            name: 'Test Product'
        }
        mockVariation = {
            id: 1,
            price: '1.5',
            name: 'Large'
        }
        mockExtra = {
            id: 1,
            price: '2.00',
            name: 'Extra Cheese'
        }

        cartService = new CartService(MockCartItem as any)
    })

    group.each.teardown(() => {
        sinon.restore()
    })

    test('should store cart item successfully', async ({ assert }) => {
        // Arrange
        const payload: CartItemPayload = {
            productId: 1,
            quantity: 2,
            details: {
                variation: 1,
                extras: [{ id: 1, quantity: 1 }]
            }
        }

        const mockRelations = {
            product: mockProduct,
            details: {
                variation: mockVariation,
                extras: [{ extraObj: mockExtra, id: 1, quantity: 1 }]
            }
        }

        const expectedCartItem = {
            userId: 1,
            productId: 1,
            details: JSON.stringify(payload.details),
            quantity: 2,
            total: '34' // (10 * 1.5 + 2 * 1) * 2 = 34
        }

        // Stub the static method
        MockCartItem.getRelations.resolves(mockRelations)
        MockCartItem.create.resolves(expectedCartItem)
        // sinon.stub(cartItemStub, 'getRelations').resolves(mockRelations)
        // sinon.stub(cartItemStub, 'create').resolves(expectedCartItem as any)


        // Act
        // const cartService = new CartService(MockCartItem as any)
        const result = await cartService.storeCartItem(mockUser, payload)

        // Assert
        assert.equal(result.userId, 1)
        assert.equal(result.productId, 1)
        assert.equal(result.quantity, 2)

        sinon.assert.calledOnceWithExactly(MockCartItem.create, expectedCartItem)
        sinon.assert.calledOnceWithExactly(MockCartItem.getRelations, payload.productId, payload.details)
    }),

    test('should update cart item successfully', async ({ assert }) => {
        // Arrange
        const userId = 1
        const cartItemId = 1
        const updatePayload = {
            quantity: 3,
            details: { variation: 2 }
        }
        const variation2 = {
            ...mockVariation,
            price: '2.0'
        }
    
        const existingCartItem = {
            id: 1,
            productId: 1,
            details: JSON.stringify({ variation: 1 }),
            quantity: 2,
            total: '30',
            save: sinon.stub().resolves()
        }
    
        const mockRelations = {
            product: mockProduct,
            details: { variation: variation2 }
        }

        MockCartItem.queryStub.first.resolves(existingCartItem)
        MockCartItem.getRelations.resolves(mockRelations)
        const result = await cartService.updateCartItem(userId, cartItemId, updatePayload as any)
        
        // Assert
        assert.equal(result.quantity, 3)
        assert.equal(result.details, JSON.stringify(updatePayload.details))
        assert.equal(result.total, "60")
        sinon.assert.calledOnce(existingCartItem.save)
        sinon.assert.calledTwice(MockCartItem.queryStub.where)
        sinon.assert.calledWith(MockCartItem.queryStub.where.getCall(0), 'id', cartItemId)
        sinon.assert.calledWith(MockCartItem.queryStub.where.getCall(1), 'user', userId)
        
        sinon.assert.calledOnce(MockCartItem.queryStub.first)
        sinon.assert.calledOnceWithExactly(MockCartItem.getRelations, 1, {variation: 2})
        
    }),
    
    test('should update only quantity when details not provided', async ({ assert }) => {
        const userId = 1
        const cartItemId = 1
        const updatePayload = { quantity: 5 }
    
        const existingCartItem = {
          id: 1,
          productId: 1,
          details: JSON.stringify({ variation: 8 }),
          quantity: 2,
          total: '20.00',
          save: sinon.stub().resolves()
        }
    
        const mockRelations = {
          product: mockProduct,
          details: { variation: mockVariation }
        }

        MockCartItem.queryStub.first.resolves(existingCartItem)
        MockCartItem.getRelations.resolves(mockRelations)
        const result = await cartService.updateCartItem(userId, cartItemId, updatePayload as any)
    
        // Assert
        assert.equal(result.quantity, 5)
        assert.equal(result.details, JSON.stringify({ variation: 8 }))
        sinon.assert.calledOnce(existingCartItem.save)
    }),

    test('should get user cart items successfully', async ({ assert }) => {
        const userId = 1
        const mockCartItems = [
            {
                id: 199,
                userId: 1,
                productId: 1,
                quantity: 2,
                total: '20.00',
                product: mockProduct
            },
            {
                id: 299,
                userId: 1,
                productId: 2,
                quantity: 1,
                total: '15.00',
                product: { ...mockProduct, id: 2, name: 'Product 2' }
            }
        ]
    
        MockCartItem.queryStub.preload.returns(mockCartItems)
        const result = await cartService.getUserCartItems(userId)
    
        // Assert
        assert.equal(result.length, 2)
        assert.equal(result[0].id, 199)
        assert.equal(result[1].id, 299)
        sinon.assert.calledOnceWithExactly(MockCartItem.queryStub.where,'user_id', userId)
        sinon.assert.calledOnceWithExactly(MockCartItem.queryStub.preload,'product')
      })
    
      test('should delete cart item successfully', async ({ assert }) => {
        const userId = 1
        const cartItemId = 1
    
        const cartItemToDelete = {
          id: 1,
          userId: 1,
          delete: sinon.stub().resolves()
        }

        MockCartItem.queryStub.first.resolves(cartItemToDelete)
        const result = await cartService.deleteCartItem(userId, cartItemId)
    
        // Assert
        assert.isTrue(result)
        sinon.assert.calledOnce(cartItemToDelete.delete)
        sinon.assert.calledOnce(MockCartItem.queryStub.first)
        sinon.assert.calledTwice(MockCartItem.queryStub.where)
        sinon.assert.calledWith(MockCartItem.queryStub.where.getCall(0), 'id', cartItemId)
        sinon.assert.calledWith(MockCartItem.queryStub.where.getCall(1), 'user', userId)

        // assert.isTrue(queryStub.where.calledWith('id', cartItemId))
        // assert.isTrue(queryStub.where.calledWith('user', userId))
    })
    /* test('should throw error for invalid quantity when storing cart item', async ({ assert }) => {
        // Arrange
        const payload: CartItemPayload = {
          productId: 1,
          quantity: 0, // Invalid quantity
          details: {}
        }

        const result = cartService.storeCartItem(mockUser, payload)
    
        // Act & Assert
        await assert.rejects(
          () => result,
          'Quantity must be greater than 0'
        )
      }) */
    
    /*   test('should throw error for NaN quantity when storing cart item', async ({ assert }) => {
        // Arrange
        const payload: CartItemPayload = {
          productId: 1,
          quantity: NaN,
          details: {}
        }
    
        // Act & Assert
        await assert.rejects(
          () => cartService.storeCartItem(mockUser, payload),
          'Quantity must be a number'
        )
      })
    
    
      test('should throw error when updating non-existent cart item', async ({ assert }) => {
        // Arrange
        const userId = 1
        const cartItemId = 999
        const updatePayload = { quantity: 3 }
    
        const queryStub = {
          where: sinon.stub().returnsThis(),
          first: sinon.stub().resolves(null)
        }
    
        sinon.stub(CartItem, 'query').returns(queryStub as any)
    
        // Act & Assert
        await assert.rejects(
          () => cartService.updateCartItem(userId, cartItemId, updatePayload),
          'Cart item not found'
        )
      })
    
      
    
      test('should throw error when deleting non-existent cart item', async ({ assert }) => {
        // Arrange
        const userId = 1
        const cartItemId = 999
    
        const queryStub = {
          where: sinon.stub().returnsThis(),
          first: sinon.stub().resolves(null)
        }
    
        sinon.stub(CartItem, 'query').returns(queryStub as any)
    
        // Act & Assert
        await assert.rejects(
          () => cartService.deleteCartItem(userId, cartItemId),
          'Cart item not found'
        )
      })
    
      test('should empty cart successfully', async ({ assert }) => {
        // Arrange
        const userId = 1
    
        const queryStub = {
          where: sinon.stub().returnsThis(),
          delete: sinon.stub().resolves([2]) // 2 items deleted
        }
    
        sinon.stub(CartItem, 'query').returns(queryStub as any)
    
        // Act
        const result = await cartService.emptyCart(userId)
    
        // Assert
        assert.deepEqual(result, [2])
        assert.isTrue(queryStub.where.calledWith('user_id', userId))
        assert.isTrue(queryStub.delete.calledOnce)
      })
    
      test('should throw error when failing to empty cart', async ({ assert }) => {
        // Arrange
        const userId = 1
    
        const queryStub = {
          where: sinon.stub().returnsThis(),
          delete: sinon.stub().resolves([0]) // No items deleted
        }
    
        sinon.stub(CartItem, 'query').returns(queryStub as any)
    
        // Act & Assert
        await assert.rejects(
          () => cartService.emptyCart(userId),
          'Fail to delete cart items'
        )
      })
    
      test('should calculate total price correctly with variation and extras', async ({ assert }) => {
        // Arrange
        const payload: CartItemPayload = {
          productId: 1,
          quantity: 2,
          details: {
            variation: 1,
            extras: [
              { id: 1, quantity: 2 },
              { id: 2, quantity: 1 }
            ]
          }
        }
    
        const mockRelations = {
          product: { ...mockProduct, price: '10.00' },
          details: {
            variation: { ...mockVariation, price: '1.5' }, // multiplier
            extras: [
              { ...mockExtra, id: 1, quantity: 2, price: '3.00' },
              { ...mockExtra, id: 2, quantity: 1, price: '1.50' }
            ]
          }
        }
    
        const expectedCartItem = {
          id: 1,
          userId: 1,
          productId: 1,
          details: JSON.stringify(payload.details),
          quantity: 2,
          total: '37.50' // ((10 * 1.5) + (3 * 2) + (1.5 * 1)) * 2 = (15 + 6 + 1.5) * 2 = 45
        }
    
        sinon.stub(CartItem, 'getRelations').resolves(mockRelations)
        sinon.stub(CartItem, 'create').resolves(expectedCartItem as any)
    
        // Act
        const result = await cartService.storeCartItem(mockUser, payload)
    
        // Assert
        assert.isString(result.total)
        // The exact calculation: (10 * 1.5 + 3*2 + 1.5*1) * 2 = (15 + 6 + 1.5) * 2 = 45
        assert.isTrue(CartItem.create.calledOnce)
      })
    
      test('should calculate total price correctly without variation and extras', async ({ assert }) => {
        // Arrange
        const payload: CartItemPayload = {
          productId: 1,
          quantity: 3,
          details: {}
        }
    
        const mockRelations = {
          product: { ...mockProduct, price: '5.00' },
          details: {}
        }
    
        const expectedCartItem = {
          id: 1,
          userId: 1,
          productId: 1,
          details: JSON.stringify(payload.details),
          quantity: 3,
          total: '15.00' // 5 * 3 = 15
        }
    
        sinon.stub(CartItem, 'getRelations').resolves(mockRelations)
        sinon.stub(CartItem, 'create').resolves(expectedCartItem as any)
    
        // Act
        const result = await cartService.storeCartItem(mockUser, payload)
    
        // Assert
        assert.equal(result.total, '15.00')
        assert.isTrue(CartItem.create.calledOnce)
      }) */
    
})
