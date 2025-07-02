import DeliveryWorker from "#models/delivery/delivery_worker"
import DeliveryOrder from "#models/delivery/delivery_order"
import Order from "#models/user/order"

import { getDistance } from 'geolib'
import NodeGeocoder from 'node-geocoder'
import type {Location} from "#types/location"

import LocationHelper from "#modules/delivery/helpers/location_helper"
import RouteCalculatorService from "./route_calculator_service.js"

import {DateTime} from 'luxon'
import { time } from "console"

import { CHUNK, MAX_STOPS } from "../constants.js"

// create OrderDelivery

// check next worker available with less distance. if the worker has an order assigned, check and assign the worker with the least result:

/* 
ORDER STOPS
FIRST STOP: first with less timeToDelivery
NEXT STOPS: iteratate through all available orders and choose the one with less timeRemaining:
timeDistance: calculate the distance from the last stop and sum it with the agregated distance in this last stop;
timeRemaining: timeToDelivery(direct from startLocation) - calculated timeDistance;

if timeRemaining < 0: check if the next worker can delivery with more timeRemaining:
timeDistance: distance from next worker to startLocation + order.distance_km;
if timeRemaining > currentTimeRemaining: continue to next order;


ORDER STOPS;

timePassed: time since order in minutes;
distanceKm: distance from startLocation to orderLocation;
routeDistanceKm: total distance from all previous stops;
extraDistanceKm: routeDistanceKm - distanceKm;
timePenalty: timePassed * timePonderationFactor;


CHOOSE:

chunk: 100;
stops: 3;
choose between a CHUNK with more timePassed;

routes[]: permutate all the chunk 
bestRoute:  less value of: totalExtraDistanceKm - totalTimePenalty

*/ 

// algorithm stops:
// calc distance between all points

export default class DeliveryOrderService{
    private startLocation = '500 Terry A Francois Blvd, San Francisco, CA'

    private readonly _deliveryOrder: typeof DeliveryOrder
    private readonly _deliveryWorker: typeof DeliveryWorker
    private readonly _locationHelper: LocationHelper
    private readonly _routeCalculatorService: RouteCalculatorService

    constructor(deliveryOrder: typeof DeliveryOrder,
        deliveryWorker: typeof DeliveryWorker,
        locationHelper: LocationHelper,
        routeCalculatorService: RouteCalculatorService) {

        this._deliveryOrder = deliveryOrder
        this._deliveryWorker = deliveryWorker
        this._locationHelper = locationHelper
        this._routeCalculatorService = routeCalculatorService
    }



    public async createDeliveryOrder(orderId: number, address: string): Promise<DeliveryOrder>{
        
        const startLocation = await this._locationHelper.getGeoLocatorFromAddress(this.startLocation)
        const addressLocation = await this._locationHelper.getGeoLocatorFromAddress(address)
        const distance = this._locationHelper.getDistanceKm(startLocation, addressLocation)
        
        if(distance === 0) {
            throw new Error("Invalid address location. Distance cannot be zero.");
        }


        const deliveryOrder = await this._deliveryOrder.create({
            orderId: orderId,
            location: JSON.stringify(addressLocation),
            status: 'pending',
            distance_km: distance,
        });

        if (!deliveryOrder) {
            throw new Error("Error creating delivery order.");
        }

        // deliveryOrder.getTimeToDelivery() 
        return deliveryOrder
    }

    // ------------ assign -------------

    private async findAvailableDeliveryOrders(): Promise<DeliveryOrder[] | null> {
        const availableOrders = await this._deliveryOrder.query()
            .where('status', 'pending')
            // SHOULD BE IMPLEMENTED AND CHANGE THE TEST
            // .orderBy('created_at', 'desc')
    
        if (availableOrders.length === 0) {
            return null;
        }
        
        const chunkAvailableOrders = availableOrders.slice(0, CHUNK)

        return chunkAvailableOrders;
    }

    /* private async findNextStop(lastStop: {distanceKm: number, deliveryOrder: DeliveryOrder}, availableOrders: DeliveryOrder[], currentWorker: DeliveryWorker):
    Promise<{distanceKm: number, deliveryOrder: DeliveryOrder} | null> {

        let orderLessTimeRemaining:{distanceKm: number, timeRemaining: number, deliveryOrder: DeliveryOrder} | null  = null

        
        for (const order of availableOrders){
            const orderDistance = order.getLocation()
            const lastOrderDistance = lastStop.deliveryOrder.getLocation()
            const distanceDiff = this._locationHelper.getDistanceKm(orderDistance, lastOrderDistance)

            const totalDistance = lastStop.distanceKm + distanceDiff
            const timeDistance = this._deliveryOrder.calcTimeDistance(totalDistance)
            const timeRemaining = order.getTimeToDelivery() - timeDistance

            if (timeRemaining < 0) {
                const nextWorkerCanDeliveryInTime = await this.checkNextWorkerCanDeliveryInTime(order, currentWorker, timeRemaining)
                
                if(nextWorkerCanDeliveryInTime){ continue }
            }

            if(orderLessTimeRemaining === null){
                orderLessTimeRemaining = {distanceKm: totalDistance, timeRemaining, deliveryOrder: order}
                continue
            }

            if (orderLessTimeRemaining.timeRemaining > timeRemaining){
                orderLessTimeRemaining = {distanceKm: totalDistance, timeRemaining, deliveryOrder: order}
            }
        }

        return orderLessTimeRemaining
    }

    private async checkNextWorkerCanDeliveryInTime(order: DeliveryOrder, currentWorker: DeliveryWorker, currentTimeRemaining: number): Promise<boolean> {
        // find next worker
        const nextWorker = await this._deliveryWorker.query()
            .where('status', 'available')
            .whereNot('id', currentWorker.id)
            .first()

        if (!nextWorker){
            return false
        }

        const startLocation = await this._locationHelper.getGeoLocatorFromAddress(this.startLocation)
        const nextWorkerLocation = nextWorker.getLocation()
        const distance = this._locationHelper.getDistanceKm(startLocation, nextWorkerLocation)

        const totalDistance = distance + order.distance_km
        const timeDistance = this._deliveryOrder.calcTimeDistance(totalDistance)
        const timeRemaining = order.getTimeToDelivery() - timeDistance

        if (timeRemaining > currentTimeRemaining) {
            return false
        }

        return true
    }*/

    public async assignDeliveryOrders(deliveryWorker: DeliveryWorker):
    Promise<{permutation: DeliveryOrder[], penalty: number} | null>{
        let maxStops = MAX_STOPS

        const availableOrders = await this.findAvailableDeliveryOrders();

        if (!availableOrders){
            return null
        }

        if(availableOrders.length < 3){
            maxStops = availableOrders.length
        }

        const getOrdersPermutations = this._routeCalculatorService.getPermutations(availableOrders, maxStops)

        if(getOrdersPermutations.length === 0){
            return null
        }

        // order to less penalty
        const orderRoutes = getOrdersPermutations.sort((a, b) => a.penalty - b.penalty)
        const bestRoute = orderRoutes[0]

        for(const order of bestRoute.permutation){
            order.deliveryWorkerId = deliveryWorker.id
            order.status = 'assigned'
            order.assignedAt = DateTime.now()
            await order.save()
        }

        return bestRoute
 
    } 

    // ORDER DELIVERED (Woker). changed status and update it

    /* public async assignDeliveryOrders(deliveryWorker: DeliveryWorker):
    Promise<{distanceKm: number, deliveryOrder: DeliveryOrder}[] | null>{

        // first stop is the first available order. the other are iterated by maxStops and aggregated by previous stops
        const availableOrders = await this.findAvailableDeliveryOrders();
        const deliveryStops: {distanceKm: number, deliveryOrder: DeliveryOrder}[] = []

        if (availableOrders === null) {
            return null
        }

        const firstDeliveryOrder = availableOrders.shift()

        if (!firstDeliveryOrder) {
            return null
        }

        deliveryStops.push({distanceKm: firstDeliveryOrder.distance_km, deliveryOrder: firstDeliveryOrder})

        for (let i = 1; i < this.maxStops && availableOrders.length > 0; i ++){
            const lastStop = deliveryStops[deliveryStops.length - 1]
            const nextStop = await this.findNextStop(lastStop, availableOrders, deliveryWorker)
            if (!nextStop) {
                break
            }

            deliveryStops.push(nextStop)
            availableOrders.splice(availableOrders.indexOf(nextStop.deliveryOrder), 1)
        }

        // if( deliveryStops.length === 0){
        //     return null
        // }

        // make a transaction
        for(const order of deliveryStops){
            order.deliveryOrder.deliveryWorkerId = deliveryWorker.id
            order.deliveryOrder.status = 'assigned'
            order.deliveryOrder.assignedAt = DateTime.now()
            await order.deliveryOrder.save()
        }

        return deliveryStops
 
        // return availableOrders;
    } */



}