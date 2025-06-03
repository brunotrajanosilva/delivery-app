import Order from "#models/order";
import OrderItem from "#models/order_item";
import Recipe from "#models/recipe";


// cancel order not paid when there is no stock. that occurs because the system permits more than available stock to be ordered
 
export default class StocksService {

    // workflow
    // receive payment webhook: set order status > deduct stock > create delivery order 

    // get stock items
    // get low stocks
    // get stock item by id

    // change stock item quantity

    // TRANSFORM ORDER INPUT, GET RECIPE STOCK ITENS AND DELETE THEM
    public async discountStockItemsByOrderItem(orderItemDetails: string, orderItemQuantity:number){

        const jsonDetails = JSON.parse(orderItemDetails)
        const recipe = Recipe.query().where("variation_id", jsonDetails.variation)

        for (const recipeItem in recipe){

            const qt = recipeItem.quantity *  orderItemQuantity
            // subtractStockItem(recipeItem.id, recipeItem.quantity)
            
        }

        for( const extra in jsonDetails.extras){
            // subtractStockItem(extra.id, extra.quantity)
        }

        

    } 
}