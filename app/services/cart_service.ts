import db from '@adonisjs/lucid/services/db'
import CartItem from "#models/user/cart_item"
import Product from "#models/product/product"
import User from '#models/user/user'
import Variation from '#models/product/variation'
import Extra from '#models/product/extra'

import {Decimal} from 'decimal.js'

import { CartItemPayload, CartItemExtras } from "../types/requests/cart_item.js";



export default class CartService{

    private readonly _cartItem: typeof CartItem
    // private readonly _product: typeof Product
    // private readonly _variation: typeof Variation
    // private readonly _extra: typeof Extra


    constructor(
        cartItem: typeof CartItem,
        // product: typeof Product,
        // variation: typeof Variation,
        // extra: typeof Extra
    ){
        this._cartItem = cartItem
        // this._product = product
        // this._variation = variation
        // this._extra = extra
    }

    /* //
    private async validateProduct(productId: number) {
        const product = await this._product.find(productId)

        if (!product) {
            throw new Error('Product not found')
        }
        return product
    }

    //
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

    //
    private async validateVariation(product: Product, variationId: number) {
        // console.log(variationId)
        const variation = await this._product.related("variations").query()
        .where("id", variationId).first()

        if (!variation) {
            throw new Error('Variation not found')
        }
        return variation
    }

    //
    private async validateExtras(product: Product, extras: Array<CartItemExtras>) {
        let extras_list = []

        for(const extra of extras) {
            const foundExtra = await this._product.related("extras").query().where("id", extra.id).first()

            if (!foundExtra) {
                throw new Error(`Extra not found: ${extra.id}`)
            }

            this.validateQuantity(extra.quantity)

            extras_list.push({...extra, price: foundExtra.price})
        }
        return extras_list
    } */

    private validateQuantity(quantity: number) {
        if (quantity <= 0) {
            throw new Error('Quantity must be greater than 0')
        }

        if (isNaN(quantity)) {
            throw new Error('Quantity must be a number')
        }
    }

    
    private calculateCartItemTotalPrice(product: Product, details: any, quantity: number): Decimal {

        let productPrice = new Decimal(product.price)
        let extrasPrice = new Decimal('0')

        if (details.variation) {
            const variation = details.variation
            productPrice = productPrice.mul(new Decimal(variation.price) )
        }

        if (details.extras){
            for(const extra of details.extras) {
                const extraPrice = new Decimal(extra.extraObj.price)

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

        this.validateQuantity(body.quantity)
        const getRelated = await this._cartItem.getRelations(body.productId, body.details)


        const total = this.calculateCartItemTotalPrice(getRelated.product, getRelated.details, body.quantity)

        const cartItemObject = {
            userId: user.id,
            productId: body.productId,
            details: JSON.stringify(body.details),
            quantity: body.quantity,
            total: total.toString()
        }


        const created = await this._cartItem.create(cartItemObject)
        return created
       
    }

    
    public async updateCartItem(userId: number, cartItemId: number, body: Partial<CartItemPayload>)
    : Promise<CartItem> {
        const cartToUpdate = await this.getCartItem(userId, cartItemId)
        const productId = cartToUpdate.productId

        // use the details from the cart item if not provided in the body
        let details_to_validate = JSON.parse(cartToUpdate.details) //
        
        if(body.quantity){
            this.validateQuantity(body.quantity)
            cartToUpdate.quantity = body.quantity
        }
        
        if(body.details){
            details_to_validate = body.details
            cartToUpdate.details = JSON.stringify(body.details)
        }
        
        const validateRelations = await this._cartItem.getRelations(productId, details_to_validate) //await this.validateDetails(product, details_to_validate)

        const recalculatedTotal = this.calculateCartItemTotalPrice(validateRelations.product, validateRelations.details, cartToUpdate.quantity)
        cartToUpdate.total = recalculatedTotal.toString()
        await cartToUpdate.save()

        return cartToUpdate
    }

    
    private async getCartItem(userId: number, cartItemId: number) {
        const cartItem = await this._cartItem.query()
        .where("id", cartItemId)
        .where("user", userId)
        .first()

        if (!cartItem) {
            throw new Error('Cart item not found')
        }
        return cartItem
    }

    
    public async getUserCartItems(userId: number) {
        const cartItems = await this._cartItem.query()
            .where('user_id', userId)
            .preload('product')

        return cartItems
    }
    
    
    public async deleteCartItem(userId: number, cartItemId: number) {
        const cartItem = await this.getCartItem(userId, cartItemId)
        await cartItem.delete()

        return true
    }

    // 
    public async emptyCart(userId: number) {
        const cartItems = await this._cartItem.query()
            .where('user_id', userId).delete()

        if (cartItems[0] === 0) {
            throw new Error("Fail to delete cart items")
        }
        return cartItems
    }

    // to order
    public async getSelectedCartItems(cartItemsIds: number[]): Promise<CartItem[]> {
        const cartItems = await this._cartItem.query().whereIn('id', cartItemsIds)

        if(!cartItems){
            throw new Error('cartItems not found')
        }

        return cartItems
    }


}