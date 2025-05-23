import db from '@adonisjs/lucid/services/db'
import CartItem from "#models/cart_item";
// import Product from "#models/product";

import { CartItemPayload, CartItemExtras } from "../types/requests/cart_item.js";



export default class CartService{

    private async validateProduct(productId: number) {
        const product = await Product.query()
            .where('id', productId)

        if (!product) {
            throw new Error('Product not found')
        }
        return product
    }

    private async validateVariation(product: Product, variationId: number) {
        const variation = await product.related("variations").query().where("id", variationId).first()

        if (!variation) {
            throw new Error('Variation not found')
        }
        return variation
    }

    private async validateExtras(product: Product, extras: Array<CartItemExtras>) {
        extras.forEach(async (extra) => {
            const foundExtra = await product.related("extras").query().where("id", extra.id).first()

            if (!foundExtra) {
                throw new Error(`Extra not found: ${extra.id}`)
            }

            this.validateQuantity(extra.quantity)
        })
        return extras
    }

    private validateQuantity(quantity: number) {
        if (quantity <= 0) {
            throw new Error('Quantity must be greater than 0')
        }

        if (isNaN(quantity)) {
            throw new Error('Quantity must be a number')
        }
    }


    /* private async findCartItemById(user: any) {
        const cartItem = await CartItem.query()
            .where('user_id', user.id)
            .preload('product')
            .preload('variation')
            .preload('extras')
            .first()

        if (!cartItem) {
            throw new Error('Cart item not found')
        }

        return cartItem
    } */


    public async storeCartItem(user: any, body: CartItemPayload) {
        // console.log(Product)
        // const product = await this.validateProduct(body.productId)
        const { default: Product } = await import('#models/product')

        console.log('Product booted?', Product.$booted) 
        console.log('cart booted?', CartItem.$booted) 
        await Product.all()
        return true

        // await this.validateVariation(product, body.variationId)
        // await this.validateExtras(product, body.extras)
        // this.validateQuantity(body.quantity)


        /* const cartItemObject = {
            userId: user.id,
            productId: body.productId,
            variationId: body.variationId,
            quantity: body.quantity,
        } */

        /* const created = await db.transaction(async (trx) => {

            const cartItem = await CartItem.create(cartItemObject)

            await cartItem.related("extras").createMany(body.extras)

            cartItem.total = this.calculateCartItemTotalPrice(cartItem)
            await cartItem.save()

            return cartItem
        })
        return created
        */

    }

    public async updateCartItem(user: any, body: Partial<CartItemPayload>, cartItemId: number) {

        // the cart fields will be udpated individually, but the extras will be replaced
        const cartToUpdate = await CartItem.findOrFail(cartItemId)

        const product = cartToUpdate.product

        if(body.quantity){
            this.validateQuantity(body.quantity)
            cartToUpdate.quantity = body.quantity
        }

        if(body.variationId){
            await this.validateVariation(product, body.variationId)
            cartToUpdate.variationId = body.variationId
        }
        
        cartToUpdate.save()
        
        if(body.extras){
            await this.validateExtras(product, body.extras)

            // remove and create new 
            cartToUpdate.related("extras").query().delete()
            cartToUpdate.related("extras").createMany(body.extras)
        }

        cartToUpdate.total = this.calculateCartItemTotalPrice(cartToUpdate)
        cartToUpdate.save()
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

    private calculateCartItemTotalPrice(cartItem: CartItem) {

        const productPrice = cartItem.product.price
        const variationPrice = cartItem.variation.price
        const quantity = cartItem.quantity
        let extrasPrice = 0

        cartItem.extras.forEach((extra: any) => {
            extrasPrice += extra.price * extra.quantity
        })

        const total = (productPrice * variationPrice + extrasPrice) * quantity
        return total
    }

    // delete cartitem
    public async deleteCartItem(user: any, cartId: number) {
        const cartItem = await CartItem.query()
            .where('user_id', user.id)
            .where('id', cartId)
            .first()

        if (!cartItem) {
            throw new Error('Cart item not found')
        }

        await cartItem.delete()
        return true
    }

    static async cleanEntireCart(user: any) {
        const cartItems = await CartItem.query()
            .where('user_id', user.id)
            .preload('product')
            .preload('variation')
            .preload('extras')

        if (!cartItems) {
            throw new Error('Cart items not found')
        }

        await db.transaction(async (trx) => {
            for (const cartItem of cartItems) {
                await cartItem.delete()
            }
        })

        return true
    }


}