import db from '@adonisjs/lucid/services/db'
import CartItem from "#models/user/cart_item";
import Product from "#models/product/product";

import {Decimal} from 'decimal.js';

import { CartItemPayload, CartItemExtras } from "../types/requests/cart_item.js";



export default class CartService{

    private async validateProduct(productId: number) {
        const product = await Product.find(productId)

        if (!product) {
            throw new Error('Product not found')
        }
        return product
    }

    private async validateCartItem(cartItemId: number) {
        const cartItem = await CartItem.query().where("id", cartItemId)
            .preload("product")
            .first()

        if (!cartItem) {
            throw new Error('Cart item not found')
        }
        return cartItem
    }

    private async validateDetails(product: Product, details: any) {
        let details_result = {}
        
        if(details.variation ){
            const variation = await this.validateVariation(product, details.variation)
            details_result.variation = variation
        }

        if(details.extras){
            const extras = await this.validateExtras(product, details.extras)
            details_result.extras = extras
        }

        return details_result

    }

    private async validateVariation(product: Product, variationId: number) {
        // console.log(variationId)
        const variation = await product.related("variations").query().where("id", variationId).first()

        if (!variation) {
            throw new Error('Variation not found')
        }
        return variation
    }

    private async validateExtras(product: Product, extras: Array<CartItemExtras>) {
        let extras_list = []

        for(const extra of extras) {
            const foundExtra = await product.related("extras").query().where("id", extra.id).first()

            if (!foundExtra) {
                throw new Error(`Extra not found: ${extra.id}`)
            }

            this.validateQuantity(extra.quantity)

            extras_list.push({...extra, price: foundExtra.price})
        }
        return extras_list
    }

    private validateQuantity(quantity: number) {
        if (quantity <= 0) {
            throw new Error('Quantity must be greater than 0')
        }

        if (isNaN(quantity)) {
            throw new Error('Quantity must be a number')
        }
    }


    private calculateCartItemTotalPrice(product: Product, quantity: number, details: any) {

        let productPrice = new Decimal(product.price)
        let extrasPrice = new Decimal('0')

        if (details.variation) {
            const variation = details.variation
            productPrice = productPrice.mul(new Decimal(variation.price) )
        }

        if (details.extras){
            for(const extra of details.extras) {
                const extraPrice = new Decimal(extra.price)

                const mult = extraPrice.mul(extra.quantity)
                extrasPrice = extrasPrice.plus(mult)
                // extrasPrice = "test value"
            }
        }

        // console.log('productPrice', productPrice.toString())
        // console.log('extrasPrice', extrasPrice.toString())

        const productTotal = productPrice.plus(extrasPrice)
        const cartTotal = productTotal.mul(quantity)


        if (cartTotal.isNaN() || cartTotal.lessThanOrEqualTo(0)) {
            throw new Error('Cart total price is invalid')
        }

        return cartTotal
    }
    


    public async storeCartItem(user: any, body: CartItemPayload) {
        const product = await this.validateProduct(body.productId)
        this.validateQuantity(body.quantity)
        const details = await this.validateDetails(product, body.details)

        const total = this.calculateCartItemTotalPrice(product, body.quantity, details)


        const cartItemObject = {
            userId: user.id,
            productId: body.productId,
            details: JSON.stringify(body.details),
            quantity: body.quantity,
            total: total.toString()
        }

        const created = await CartItem.create(cartItemObject)
        return created
       
    }

    public async updateCartItem(user: any, body: Partial<CartItemPayload>, cartItemId: number)
    : Promise<CartItem> {
        const cartToUpdate = await this.validateCartItem(cartItemId)
        const product = cartToUpdate.product

        // use the details from the cart item if not provided in the body
        let details_to_validate = JSON.parse(cartToUpdate.details)

        
        if(body.quantity){
            this.validateQuantity(body.quantity)
            cartToUpdate.quantity = body.quantity
        }
        
        if(body.details){
            details_to_validate = body.details
            cartToUpdate.details = JSON.stringify(body.details)
        }
        
        const validate_details = await this.validateDetails(product, details_to_validate)

        const recalculatedTotal = this.calculateCartItemTotalPrice(product, cartToUpdate.quantity, validate_details)
        cartToUpdate.total = recalculatedTotal.toString()
        await cartToUpdate.save()

        return cartToUpdate
    }

    public async getUserCartItems(user: any) {
        const cartItems = await CartItem.query()
            .where('user_id', user.id)
            .preload('product')

        return cartItems
    }

    
    // delete cartitem
    public async deleteCartItem(user: any, cartItemId: number) {
        const cartItem = await this.validateCartItem(cartItemId)
        await cartItem.delete()
        
        return true
    }

    public async emptyCart(user: any) {
        const cartItems = await CartItem.query()
            .where('user_id', user.id).delete()

        if (cartItems[0] === 0) {
            throw new Error("Fail to delete cart items")
        }
        return cartItems
    }


}