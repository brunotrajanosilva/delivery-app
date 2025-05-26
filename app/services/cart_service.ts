import db from '@adonisjs/lucid/services/db'
import CartItem from "#models/cart_item";
import Product from "#models/product";

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
        // console.log("product:", product)
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

        let productPrice = product.price
        let extrasPrice = 0

        if (details.variation) {
            const variation = details.variation
            productPrice = productPrice * variation.price
        }

        if (details.extras){
            details.extras.forEach((extra: any) => {
                extrasPrice += extra.price * extra.quantity
            })
        }

        // console.log("Price:", productPrice, extrasPrice, quantity)

        const total = (productPrice + extrasPrice) * quantity

        if (total <= 0 || isNaN(total)) {
            throw new Error('Total price is invalid')
        }

        return total
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
            total: total
        }

        const created = await CartItem.create(cartItemObject)
        return created
       
    }

    public async updateCartItem(user: any, body: Partial<CartItemPayload>, cartItemId: number)
    : Promise<CartItem> {
        const cartToUpdate = await this.validateCartItem(cartItemId)
        const product = cartToUpdate.product
        // console.log(product, cartToUpdate)
        let details_to_validate = JSON.parse(cartToUpdate.details)

        
        if(body.quantity){
            this.validateQuantity(body.quantity)
            cartToUpdate.quantity = body.quantity
        }
        
        if(body.details){
            details_to_validate = body.details
            cartToUpdate.details = JSON.stringify(body.details)
        }
        
        // console.log(details_to_validate)
        const validate_details = await this.validateDetails(product, details_to_validate)

        cartToUpdate.total = this.calculateCartItemTotalPrice(product, cartToUpdate.quantity, validate_details)
        cartToUpdate.save()

        return cartToUpdate
    }

    /* public async getUserCartItems(user: any) {
        const result = await this.findCartItemById(user)
        return result
    } */


    // to make an order, we need to get the cart items and format them
    /* static async getOrderItemsOutput(user: any) {

        try{
            const cartItems = await this.findCartItemById(user)
    
            const orderItems = cartItems.map((cartItem) => {
    
                const productDescription = {name: cartItem.product.name, price: cartItem.product.price}
                const variationDescription = {name: cartItem.variation.name, price: cartItem.variation.price}
                const extrasDescription = cartItem.extras.map((extra: any) => {
                    return {name: extra.name, price: extra.price}
                })
    
                const details = { variation: variationDescription, extras: extrasDescription }
    
                const totalPrice = this.calculateCartItemTotalPrice(cartItem)
                return {
                    productId: cartItem.productId,
                    productDescription: JSON.stringify(productDescription),
                    quantity: cartItem.quantity,
                    details: JSON.stringify(details),
                    price: totalPrice,
                }
            })
    
            return orderItems

        }catch (error){
            return error.message
        }

    } */

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