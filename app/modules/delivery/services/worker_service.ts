
/* 
algorithm:
TimeDistance: representation of kilometers in time. Example: 1km - 1 min

Tolerance: tolerance for each kilometers. Example: tolerance = 200%. so will be 2min for each km

TimeToDelivery: time(distance_km from startPoint) * Tolerance - timeDistance passed since order creation


assign delivery orders to worker:

choose up three pending deliverys with less TimeToDelivery.

permute the three and caculate the path for each. add the better result in a variable.

the best result: subsequent paths consirer the timeDistance acumulated. Example: B = A + A to B 
each path computate DeliveryTimeDeviation = timeToDelivery - timeDistance
best result is the one with more DeliveryTimeDeviation

assign the deliverys and show the path to the worker

*/

/* 
class DeliveryStopsCalc{
    type Point = {
    lat: number
    lon: number
    }
    
    type DeliveryStop = {
    id: string | number
    location: Point
    serviceTime: number // in seconds
    timeWindow?: [number, number] // [earliestArrival, latestArrival] in seconds
    }
    
    type RouteResult = {
    route: DeliveryStop[]
    totalDistanceKm: number
    isValid: boolean
    arrivalTimes: number[]
    }
    
    function deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
    }
    
    function haversineDistance(p1: Point, p2: Point): number {
    const R = 6371 // km
    const dLat = deg2rad(p2.lat - p1.lat)
    const dLon = deg2rad(p2.lon - p1.lon)
    
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(deg2rad(p1.lat)) * Math.cos(deg2rad(p2.lat)) * Math.sin(dLon / 2) ** 2
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
    }
    
    function permutations<T>(array: T[]): T[][] {
        if (array.length === 0) return [[]]
        return array.flatMap((item, i) =>
            permutations([...array.slice(0, i), ...array.slice(i + 1)]).map(p => [item, ...p])
        )
    }
    
    function calculateBestRoute(
    start: Point,
    deliveries: DeliveryStop[],
    averageSpeedKmH = 40 // average speed for time estimation
    ): RouteResult | null {

    const speedMPerSec = (averageSpeedKmH * 1000) / 3600
    
    const routes = permutations(deliveries)
    
    let bestRoute: RouteResult | null = null
    
    for (const route of routes) {
        let totalDistance = 0
        let currentTime = 0 // assuming starts at time 0
        let currentLocation = start
        const arrivalTimes: number[] = []
        let isValid = true
    
        for (const stop of route) {
        const distance = haversineDistance(currentLocation, stop.location)
        totalDistance += distance
    
        const travelTime = (distance * 1000) / speedMPerSec // seconds
    
        currentTime += travelTime
    
        // Check time window
        if (stop.timeWindow) {
            const [earliest, latest] = stop.timeWindow
            if (currentTime < earliest) {
            currentTime = earliest // wait until earliest
            }
            if (currentTime > latest) {
            isValid = false
            break
            }
        }
    
        arrivalTimes.push(currentTime)
        currentTime += stop.serviceTime
        currentLocation = stop.location
        }
    
        if (isValid) {
        if (!bestRoute || totalDistance < bestRoute.totalDistanceKm) {
            bestRoute = {
            route,
            totalDistanceKm: totalDistance,
            isValid,
            arrivalTimes
            }
        }
        }
    }
    
    return bestRoute
    }
      
}

*/


/* private async findAvailableWorkers(){
        const availableWorkers = await DeliveryWorker.query()
        .where("status", "available")

        return availableWorkers
    }

    private calcDistance(fromLocation: Location , toLocation: Location): number{
        const distance = getDistance(fromLocation, toLocation)
        return distance
    }

    private async findClosestWorker(): Promise<{bestWorker: DeliveryWorker | null, returnDistance: number}> {
        const availableWorkers = await this.findAvailableWorkers();
        let bestWorker: DeliveryWorker | null = null;
        let minDistance = Number.POSITIVE_INFINITY;

        for (const worker of availableWorkers) {
            const distanceToOrder = this.calcDistance(worker.getLocation(), this.startLocation);
            if (distanceToOrder < minDistance) {
                minDistance = distanceToOrder
                bestWorker = worker
            }
        }

        return {bestWorker, returnDistance: minDistance}
    }

    private async assignOrderToWorker(deliveryOrder: DeliveryOrder): Promise<DeliveryOrder | null> {
        const {bestWorker, returnDistance} = await this.findClosestWorker();

        if (!bestWorker) {
            console.log("No available workers found.")
            return null
        }
        const moreThanOneOrder = await bestWorker.getAssignedOrders()

        if (moreThanOneOrder.length > 0) {
            const lastOrderAssigned = moreThanOneOrder[0]

            // const distanceToReturn = this.calcDistance(lastOrderAssigned.getLocation(), deliveryOrder.getLocation());

            const distanceToNewOrder = this.calcDistance(this.startLocation, orderId.toString()); // Assuming orderId is a location for simplicity

            if (distanceToReturn + distanceToNewOrder < minDistance) {
                console.log("Assigning new order to worker with existing orders.")
            } else {
                console.log("Worker has too many orders, cannot assign new order.")
                return null;
            }
        }

        // Update worker status
        closestWorker.status = 'busy';
        await closestWorker.save();

        return deliveryOrder;
    
    } */
