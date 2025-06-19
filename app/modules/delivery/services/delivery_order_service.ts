import DeliveryWorker from "#models/delivery/delivery_worker";
import DeliveryOrder from "#models/delivery/delivery_order";
import Order from "#models/user/order";

import { getDistance } from 'geolib'
import NodeGeocoder from 'node-geocoder';
import type {Location} from "#types/location"

// create OrderDelivery

// check next worker available with less distance. if the worker has an order assigned, check and assign the worker with the least result:

// algorithm stops:
// calc distance between all points

export default class DeliveryOrderService{

    public async getGeoLocatorFromAdress(address: string): Promise<Location>{
        const options = {
            provider: 'openstreetmap',
            httpAdapter: 'https',
            formatter: null, // 'gpx', 'string', ...
        };

        const geocoder = NodeGeocoder(options)

        const geoLocation = await geocoder.geocode(address)
        
        if (!geoLocation || geoLocation.length === 0) {
            throw new Error("Location not found for address: " + address);
        }

        const result =  {
            latitude: geoLocation[0].latitude,
            longitude: geoLocation[0].longitude
        }

        return result
    }

    private startLocation = '500 Terry A Francois Blvd, San Francisco, CA'

    public async createDeliveryOrder(orderId: number, address: string): Promise<DeliveryOrder>{
        
        const startLocation = await this.getGeoLocatorFromAdress(this.startLocation)
        const addressLocation = await this.getGeoLocatorFromAdress(address)
        const distance = getDistance(startLocation, addressLocation)
        
        if(distance === 0) {
            throw new Error("Invalid address location. Distance cannot be zero.");
        }


        const deliveryOrder = await DeliveryOrder.create({
            orderId: orderId,
            location: JSON.stringify(addressLocation),
            status: 'pending',
            distance_km: distance,
        });

        if (!deliveryOrder) {
            throw new Error("Error creating delivery order.");
        }

        return deliveryOrder
    }



}