import Coupon from "#models/coupon";


export default class CouponService{

    private async findCouponByCode(code: string) {
        const coupon = await Coupon.query().where('code', code).first()

        if (!coupon) {
            throw new Error('coupon not found')
        }

        return coupon
    }


    private validateCouponDate(coupon: Coupon) {
        const now = new Date()
        const startDate = new Date(coupon.startDate)
        const endDate = new Date(coupon.endDate)

        if (now < startDate) {
            throw new Error('coupon not valid yet')
        }

        if (now > endDate) {
            throw new Error('coupon expired')
        }

        return true
    }

    private validateCouponUsage(quantity: number) {
        if (quantity != null && quantity <= 0) {
            throw new Error('coupon usage limit reached')
        }

        return true
    }

    private validateCouponMinimumPurchase(minimumPurchase: number, total: number) {
        if (total < minimumPurchase) {
            throw new Error('minimum purchase not met')
        }

        return true
    }

    private calcDiscount(discountType: string, discountValue: number, total: number) {

        if (discountType === 'percentage') {
            return total * (discountValue / 100)
        }

        if (discountType === 'flat') {
            return discountValue
        }

        throw new Error('invalid discount type')
    }

    public async applyCoupon(code: string, total: number) {
        const coupon = await this.findCouponByCode(code)

        this.validateCouponDate(coupon)
        this.validateCouponUsage(coupon.quantity)
        this.validateCouponMinimumPurchase(coupon.minimumPurchase, total)

        // const discount = this.calcDiscount(coupon.discountType, coupon.discountValue, total)

        // const coupon = await Coupon.findByCode(code)

        if (coupon.isExpired()) {throw new Error('coupon expired')}
        if (coupon.isUsed()) {throw new Error('coupon usage limit reached')}
        if (coupon.isUnderMinimumPurchase(total)) {throw new Error('minimum purchase not met')}

        const discount = coupon.calcDiscount(total)


        return {
            coupon,
            discount,
        }
    }

}