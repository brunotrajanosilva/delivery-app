import {test} from "@japa/runner"
import CouponService from "#services/coupon_service"
import Coupon from "#models/coupon"

// import { couponMock } from '../__mocks__/coupon'
import { mockModelQuery, restoreAllMocks } from "#tests/__mocks__/query"

test.group('CouponService (Auto Restore)', (group) => {
  group.each.setup(() => {
    // You can skip this and call `mockModelQuery()` in each test
  })

  group.each.teardown(() => {
    restoreAllMocks()
  })

  test('applies percentage discount', async ({assert}) => {
    const couponMock = {
        code: 'SAVE10',
        startDate: new Date(Date.now() - 60_000).toISOString(),
        endDate: new Date(Date.now() + 60_000 * 60).toISOString(),
        quantity: 5,
        minimumPurchase: 50,
        discountType: 'percentage',
        discountValue: 10,
    }
    
    mockModelQuery(Coupon, couponMock)

    const service = new CouponService()
    const result = await service.applyCoupon('SAVE10', 100)

    assert.equal(result.discount, 10)
  })

  test('throws when coupon is not found', async ({assert}) => {
  
    mockModelQuery(Coupon, null)
    const service = new CouponService()

    await assert.rejects( ()=>service.applyCoupon('SAV10', 100), "coupon not found")
  })

  test('throws when coupon is not valid yet', async ({assert}) => {
    const couponMock = {
        code: 'SAVE10',
        startDate: new Date(Date.now() + 60_000).toISOString(),
        endDate: new Date(Date.now() + 60_000 * 60).toISOString(),
        quantity: 5,
        minimumPurchase: 50,
        discountType: 'percentage',
        discountValue: 10,
    }

    mockModelQuery(Coupon, couponMock)
    const service = new CouponService()

    await assert.rejects( ()=>service.applyCoupon('SAVE10', 100), "coupon not valid yet")
  })

  test('throws when coupon is expired', async ({assert}) => {
    const couponMock = {
        code: 'SAVE10',
        startDate: new Date(Date.now() - 60_000).toISOString(),
        endDate: new Date(Date.now() - 60_000 * 60).toISOString(),
        quantity: 5,
        minimumPurchase: 50,
        discountType: 'percentage',
        discountValue: 10,
    }

    mockModelQuery(Coupon, couponMock)
    const service = new CouponService()

    await assert.rejects( ()=>service.applyCoupon('SAVE10', 100), "coupon expired")
  })

  test('throws when coupon usage limit is reached', async ({assert}) => {
    const couponMock = {
        code: 'SAVE10',
        startDate: new Date(Date.now() - 60_000).toISOString(),
        endDate: new Date(Date.now() + 60_000 * 60).toISOString(),
        quantity: 0,
        minimumPurchase: 50,
        discountType: 'percentage',
        discountValue: 10,
    }

    mockModelQuery(Coupon, couponMock)
    const service = new CouponService()

    await assert.rejects( ()=>service.applyCoupon('SAVE10', 100), "coupon usage limit reached")
  })

  test('throws when minimum purchase is not met', async ({assert}) => {
    const couponMock = {
        code: 'SAVE10',
        startDate: new Date(Date.now() - 60_000).toISOString(),
        endDate: new Date(Date.now() + 60_000 * 60).toISOString(),
        quantity: 5,
        minimumPurchase: 100,
        discountType: 'percentage',
        discountValue: 10,
    }

    mockModelQuery(Coupon, couponMock)
    const service = new CouponService()

    await assert.rejects( ()=>service.applyCoupon('SAVE10', 50), "minimum purchase not met")
  })

  test('throws when discount type is invalid', async ({assert}) => {
    const couponMock = {
        code: 'SAVE10',
        startDate: new Date(Date.now() - 60_000).toISOString(),
        endDate: new Date(Date.now() + 60_000 * 60).toISOString(),
        quantity: 5,
        minimumPurchase: 50,
        discountType: 'invalid',
        discountValue: 10,
    }

    mockModelQuery(Coupon, couponMock)
    const service = new CouponService()

    await assert.rejects( ()=>service.applyCoupon('SAVE10', 100), "invalid discount type")
  })

})
