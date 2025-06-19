import { test } from '@japa/runner'
import Coupon from '#models/user/coupon'

let coupon: Coupon
import {Decimal} from 'decimal.js'

function createCoupon(overrides = {}) {
  const base = new Coupon()
  Object.assign(base, {
    code: 'SAVE08',
    discountType: 'percentage',
    discountValue: ".10",
    startDate: new Date(Date.now() - 10000).toISOString(),
    endDate: new Date(Date.now() + 60_000).toISOString(),
    quantity: 10,
    minimumPurchase: "50.00",
    ...overrides,
  })
  return base
}

const total = new Decimal("100.00")

test.group('Coupon Model', (group) => {
  group.each.setup(async () => {
    // Initialize a fresh coupon before each test
    // coupon = createCoupon()
  })

  // throws when not find coupon

  test('applies valid percentage coupon', async ({ assert }) => {
    coupon = createCoupon()
    const discount = coupon.apply(total)

    assert.isTrue(discount.equals( new Decimal("10") ) )
    // assert.equal(result.coupon.quantity, 9) // quantity decreased
  })

  test('applies valid flat coupon', async ({ assert }) => {
    coupon = createCoupon({
      discountType: 'flat',
      discountValue: "15",
    })

    const discount = coupon.apply(total)

    assert.isTrue(discount.equals( new Decimal("15.00") ) )

  })

  test('use coupon and decreases quantity', async ({ assert }) => {
    coupon = createCoupon()

    await coupon.use()
    assert.equal(coupon.quantity, 9) // quantity decreased
  })

  test('throws when coupon is expired', async ({ assert }) => {
    coupon = createCoupon({
      endDate: new Date(Date.now() - 60_000).toISOString(),
    })

    await assert.rejects(() => coupon.apply(total), "coupon expired")
  })

  test('throws when coupon is used up', async ({ assert }) => {
    coupon = createCoupon({ quantity: 0 })

    await assert.rejects(() => coupon.apply(total), "coupon usage limit reached")
  })

  test('throws when purchase total is too low', async ({ assert }) => {
    coupon = createCoupon({ minimumPurchase: "200" })

    await assert.rejects(() => coupon.apply(total), "minimum purchase not met")
  })

  test('throws for invalid discount type', async ({ assert }) => {
    coupon = createCoupon({ discountType: 'unknown' })

    await assert.rejects(() => coupon.apply(total), "invalid discount type")
  })
})
