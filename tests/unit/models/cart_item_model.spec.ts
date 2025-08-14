import { test } from '@japa/runner'
import sinon from 'sinon'
import { Decimal } from 'decimal.js'
import CartItem from '#models/user/cart_item'

test.group('CartItem', (group) => {
  let cartItem: CartItem
  let sandbox: sinon.SinonSandbox

  group.setup(() => {
    sandbox = sinon.createSandbox()
  })

  group.teardown(() => {
    sandbox.restore()
  })

  group.each.setup(() => {
    cartItem = new CartItem()
    cartItem.quantity = 2
  })

  group.each.teardown(() => {
    sandbox.restore()
  })

  test('should calculate cart item total price with variation only', ({ assert }) => {
    // Arrange
    const mockVariation = {
      price: new Decimal('1.5'), // 150% of product price
      product: {
        price: new Decimal('10.00'),
      },
    }

    cartItem.variation = mockVariation as any
    cartItem.cartItemExtras = [] as any

    // Spy on private methods to verify they're called
    const calcVariationPriceSpy = sandbox.spy(cartItem as any, 'calcVariationPrice')
    const calcCartItemExtrasPriceSpy = sandbox.spy(cartItem as any, 'calcCartItemExtrasPrice')

    // Act
    const result = cartItem.calcCartItemTotalPrice()

    // Assert
    // Variation price: 10.00 * 1.5 = 15.00
    // Total: 15.00 * 2 (quantity) = 30.00
    // console.log()
    assert.isTrue(result.equals(new Decimal('30.00')))
    assert.isTrue(cartItem.total.equals(new Decimal('30.00')))

    // // Verify private methods were called
    assert.isTrue(calcVariationPriceSpy.calledOnce)
    assert.isFalse(calcCartItemExtrasPriceSpy.called) // Should not be called when no extras
  })

  test('should calculate cart item total price with variation and extras', ({ assert }) => {
    // Arrange
    const mockVariation = {
      price: new Decimal('1.2'), // 120% of product price
      product: {
        price: new Decimal('15.00'),
      },
    }

    const mockCartItemExtras = [
      {
        quantity: 1,
        extra: {
          price: new Decimal('2.50'),
        },
      },
      {
        quantity: 2,
        extra: {
          price: new Decimal('1.75'),
        },
      },
    ]

    cartItem.variation = mockVariation as any
    cartItem.cartItemExtras = mockCartItemExtras as any

    // Spy on private methods
    const calcVariationPriceSpy = sandbox.spy(cartItem as any, 'calcVariationPrice')
    const calcCartItemExtrasPriceSpy = sandbox.spy(cartItem as any, 'calcCartItemExtrasPrice')

    // Act
    const result = cartItem.calcCartItemTotalPrice()

    // Assert
    // Variation price: 15.00 * 1.2 = 18.00
    // Extras price: (2.50 * 1) + (1.75 * 2) = 2.50 + 3.50 = 6.00
    // Subtotal: 18.00 + 6.00 = 24.00
    // Total: 24.00 * 2 (quantity) = 48.00
    assert.isTrue(result.equals(new Decimal('48.00')))
    assert.isTrue(cartItem.total.equals(new Decimal('48.00')))

    // Verify both private methods were called
    assert.isTrue(calcVariationPriceSpy.calledOnce)
    assert.isTrue(calcCartItemExtrasPriceSpy.calledOnce)
  })

  test('should handle zero quantity correctly', ({ assert }) => {
    // Arrange
    cartItem.quantity = 0
    const mockVariation = {
      price: new Decimal('1.0'),
      product: {
        price: new Decimal('10.00'),
      },
    }

    cartItem.variation = mockVariation as any
    cartItem.cartItemExtras = [] as any

    // Act
    const result = cartItem.calcCartItemTotalPrice()

    // Assert
    // Even with variation price 10.00, quantity 0 should result in 0
    assert.isTrue(result.equals(new Decimal('0.00')))
    assert.isTrue(cartItem.total.equals(new Decimal('0.00')))
  })

  test('should handle decimal precision correctly', ({ assert }) => {
    // Arrange
    cartItem.quantity = 3
    const mockVariation = {
      price: new Decimal('3.333333'), // Repeating decimal
      product: {
        price: new Decimal('3'),
      },
    }

    const mockCartItemExtras = [
      {
        quantity: 1,
        extra: {
          price: new Decimal('0.000001'),
        },
      },
    ]

    cartItem.variation = mockVariation as any
    cartItem.cartItemExtras = mockCartItemExtras as any

    // Act
    const result = cartItem.calcCartItemTotalPrice()
    console.log(result.toString())

    // Assert
    // Variation price: 3.333333 x 3 = 9.999999
    // Extras price: 0.000001 * 1
    // Total: 10
    const expected = new Decimal('30')
    assert.isTrue(result.equals(expected))
    assert.isTrue(cartItem.total.equals(expected))
  })

  test('should handle empty extras array', ({ assert }) => {
    // Arrange
    const mockVariation = {
      price: new Decimal('2.0'),
      product: {
        price: new Decimal('5.00'),
      },
    }

    cartItem.variation = mockVariation as any
    cartItem.cartItemExtras = [] as any

    const calcCartItemExtrasPriceSpy = sandbox.spy(cartItem as any, 'calcCartItemExtrasPrice')

    // Act
    const result = cartItem.calcCartItemTotalPrice()

    // Assert
    // Variation price: 5.00 * 2.0 = 10.00
    // Total: 10.00 * 2 (quantity) = 20.00
    assert.isTrue(result.equals(new Decimal('20.00')))

    // calcCartItemExtrasPrice should not be called when cartItemExtras is empty
    assert.isFalse(calcCartItemExtrasPriceSpy.called)
  })

  test('should set total property on cartItem instance', ({ assert }) => {
    // Arrange
    const mockVariation = {
      price: new Decimal('1.0'),
      product: {
        price: new Decimal('7.50'),
      },
    }

    cartItem.variation = mockVariation as any
    cartItem.cartItemExtras = [] as any

    // Verify total is initially undefined
    assert.isUndefined(cartItem.total)

    // Act
    const result = cartItem.calcCartItemTotalPrice()

    // Assert
    const expected = new Decimal('15.00') // 7.50 * 1.0 * 2
    assert.isTrue(result.equals(expected))
    assert.isDefined(cartItem.total)
    assert.isTrue(cartItem.total.equals(expected))
  })

  test('should handle multiple extras with different quantities', ({ assert }) => {
    // Arrange
    cartItem.quantity = 1 // Simplify calculation
    const mockVariation = {
      price: new Decimal('1.0'),
      product: {
        price: new Decimal('10.00'),
      },
    }

    const mockCartItemExtras = [
      {
        quantity: 3,
        extra: {
          price: new Decimal('1.00'),
        },
      },
      {
        quantity: 2,
        extra: {
          price: new Decimal('2.50'),
        },
      },
      {
        quantity: 1,
        extra: {
          price: new Decimal('0.50'),
        },
      },
    ]

    cartItem.variation = mockVariation as any
    cartItem.cartItemExtras = mockCartItemExtras as any

    const calcVariationPriceSpy = sandbox.spy(cartItem as any, 'calcVariationPrice')
    const calcCartItemExtrasPriceSpy = sandbox.spy(cartItem as any, 'calcCartItemExtrasPrice')

    // Act
    const result = cartItem.calcCartItemTotalPrice()

    // Assert
    // Variation price: 10.00 * 1.0 = 10.00
    // Extras price: (1.00 * 3) + (2.50 * 2) + (0.50 * 1) = 3.00 + 5.00 + 0.50 = 8.50
    // Subtotal: 10.00 + 8.50 = 18.50
    // Total: 18.50 * 1 = 18.50
    assert.isTrue(result.equals(new Decimal('18.50')))
    assert.isTrue(cartItem.total.equals(new Decimal('18.50')))

    // Verify both private methods were called
    assert.isTrue(calcVariationPriceSpy.calledOnce)
    assert.isTrue(calcCartItemExtrasPriceSpy.calledOnce)
  })
})
