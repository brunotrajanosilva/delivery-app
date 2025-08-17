import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { assert } from '@japa/assert'

import RouteCalculatorService from '#modules/delivery/services/route_calculator_service'


class DeliveryOrderMock {
    public distanceKm: number
    private name: string
  
    constructor(name: string, distanceKm: number) {
        this.distanceKm = distanceKm
        this.name = name
    }
  
    public getTimePenalty(): number {
        return Math.floor(Math.random() * 51); // Random integer between 0 and 100
    }

    public getLocation(): number{
        return this.distanceKm
    }


    toString(): string{
        return this.name
    }
}

// mock the distance of two places, using the distance between of the objects
class LocationHelperMock {
    public getDistanceKm(a:number, b: number): number{
        const result = (a + b) / 2

        return result
    }
}
  

test.group('RouteCalculatorService', (group) => {

    let location_helper: any
    let route_calculator_service: any
    let sampleLocations: any
    let elements: any

    group.each.setup(()=>{
        location_helper = new LocationHelperMock()
        route_calculator_service = new RouteCalculatorService(location_helper as any)

        sampleLocations = [
            {
                name: 'San Francisco Downtown',
                time: 15,
                distanceKm: 0,
                distance_between: 0
            },
            {
                name: 'Silicon Valley',
                time: 30,
                distanceKm: 50,
                distance_between: 50
            },
            {
                name: 'Berkeley Campus',
                time: 25,
                distanceKm: 20,
                distance_between: 75
            },
            {
                name: 'San Jose Airport',
                time: 45,
                distanceKm: 70,
                distance_between: 120
            },
            {
                name: 'Oakland Port',
                time: 20,
                distanceKm: 15,
                distance_between: 90
            },
            {
                name: 'Palo Alto',
                time: 35,
                distanceKm: 55,
                distance_between: 150
            },
            {
                name: 'Mountain View',
                time: 40,
                distanceKm: 60,
                distance_between: 180
            },
            {
                name: 'Santa Clara',
                time: 50,
                distanceKm: 75,
                distance_between: 220
            },
            {
                name: 'Fremont',
                time: 55,
                distanceKm: 80,
                distance_between: 280
            },
            {
                name: 'Sacramento',
                time: 60,
                distanceKm: 140,
                distance_between: 380
            }
        ]

    }),

    test("get permutations with 10 and 3", async ({assert}) => {
        let elements: any[] = []

        for(const location of sampleLocations){
            const deliveryOrder = new DeliveryOrderMock(location.name, location.distanceKm)
            deliveryOrder.getTimePenalty = () => location.time 
            deliveryOrder.getLocation = () => location.distance_between 

            elements.push(deliveryOrder) 
        }
        
        const startTime = performance.now();

        const permutations = route_calculator_service.getPermutations(elements, 3)

        const endTime = performance.now();
        console.log(`Execution time: ${endTime - startTime} milliseconds`)
        // console.log(permutations[0])

        const firstPermutation = permutations[0] // san francisco, silicon valley, berkeley
        // totalPenalty = time 15 + 30 + 25 = 70; penalty -25 + 67.5; totalDistance = 0 + 25 + 62.5

        const hundredthpermutation = permutations[99] // silicon valley, Oakland Port, Palo Alto, 205
        // totalPenalty = time 30 + 20 + 35 = 85; penalty = 105 + 185; totalDistance = 50 + 70 + 120 = 240

        assert.equal(firstPermutation.permutation.length, 3)
        assert.equal(firstPermutation.permutation[0].deliveryOrder.toString(), 'San Francisco Downtown')

        assert.equal(firstPermutation.permutation[0].routeDistance, 0)
        assert.equal(firstPermutation.permutation[1].routeDistance, 25)
        assert.equal(firstPermutation.permutation[2].routeDistance, 87.5)

        assert.equal(firstPermutation.penalty, -27.5) // confirm
        assert.equal(hundredthpermutation.penalty, 205) // confirm

    }),
    test("get permutations with 2 and 2", async ({assert}) => {

        const sampleLocations2 = sampleLocations.splice(0,2)
        let elements: any[] = []

        for(const location of sampleLocations2){  
            const deliveryOrder = new DeliveryOrderMock(location.name, location.distanceKm)
            deliveryOrder.getTimePenalty = () => location.time 
            deliveryOrder.getLocation = () => location.distance_between 

            elements.push(deliveryOrder)        
        }
        

        const permutations = route_calculator_service.getPermutations(elements, 2)

        const firstPermutation = permutations[0] // san francisco, silicon valley, berkeley
        // totalPenalty = time 15 + 30 + 25 = 70; penalty -25 + 67.5; totalDistance = 0 + 25 + 62.5

        assert.equal(firstPermutation.permutation.length, 2)
        assert.equal(firstPermutation.permutation[0].deliveryOrder.toString(), 'San Francisco Downtown')
        assert.equal(firstPermutation.penalty, -70) // confirm
        assert.equal(permutations[1].penalty, 30) // confirm

        // console.log(permutationsK2)
        // assert.equal(permutationsK2[0].permutation.length, 2)

    })
})