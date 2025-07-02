import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { assert } from '@japa/assert'

import RouteCalculatorService from '#modules/delivery/services/route_calculator_service'


class DeliveryOrderMock {
    public distance_km: number
    private name: string
  
    constructor(name: string, distance_km: number) {
        this.distance_km = distance_km
        this.name = name
    }
  
    public getTimePenalty(): number {
        return Math.floor(Math.random() * 51); // Random integer between 0 and 100
    }

    public getLocation(): number{
        return this.distance_km
    }


    toString(): string{
        return this.name
    }
}

class LocationHelperMock {
    public getDistanceKm(a:number, b: number): number{
        const result = (a + b) / 2

        return result
    }
}
  

test.group('RouteCalculatorService', (group) => {
    test("get permutations", async ({assert}) => {

        const location_helper = new LocationHelperMock()

        const route_calculator_service = new RouteCalculatorService(location_helper)

        /* const elements = [
            'a', 'b', 'c', 'd', 'e', 'f' ,'g', 'h', 'i', 'j',
            'a', 'b', 'c', 'd', 'e', 'f' ,'g', 'h', 'i', 'j',
            'a', 'b', 'c', 'd', 'e', 'f' ,'g', 'h', 'i', 'j',
            'a', 'b', 'c', 'd', 'e', 'f' ,'g', 'h', 'i', 'j'
        ] */

       /* let elements: RandomDataClass[] = []

        for (let i=0; i < 40; i++){
            const element = new RandomDataClass(`Element ${i}`)
            elements.push(element)
        } */

        const sampleLocations = [
            {
                name: 'San Francisco Downtown',
                time: 15,
                distance_km: 0,
                distance_between: 0
            },
            {
                name: 'Silicon Valley',
                time: 30,
                distance_km: 50,
                distance_between: 50
            },
            {
                name: 'Berkeley Campus',
                time: 25,
                distance_km: 20,
                distance_between: 75
            },
            {
                name: 'San Jose Airport',
                time: 45,
                distance_km: 70,
                distance_between: 120
            },
            {
                name: 'Oakland Port',
                time: 20,
                distance_km: 15,
                distance_between: 90
            },
            {
                name: 'Palo Alto',
                time: 35,
                distance_km: 55,
                distance_between: 150
            },
            {
                name: 'Mountain View',
                time: 40,
                distance_km: 60,
                distance_between: 180
            },
            {
                name: 'Santa Clara',
                time: 50,
                distance_km: 75,
                distance_between: 220
            },
            {
                name: 'Fremont',
                time: 55,
                distance_km: 80,
                distance_between: 280
            },
            {
                name: 'Sacramento',
                time: 60,
                distance_km: 140,
                distance_between: 380
            }
        ]

        // let duplicatedSample: any[] = []

        // for (let i=0; i < 20; i++){
        //     duplicatedSample = [...duplicatedSample, ...sampleLocations]
        // }

        // console.log(duplicatedSample.length)

        let elements: any[] = []

        for(const location of sampleLocations){
            const deliveryOrder = new DeliveryOrderMock(location.name, location.distance_km)
            deliveryOrder.getTimePenalty = () => location.time // Mocking the getTimePenalty method
            deliveryOrder.getLocation = () => location.distance_between // Mocking the getLocation method
            
            elements.push(deliveryOrder)
        }
          
           

        const permutations = route_calculator_service.getPermutations(elements, 3)

        const firstPermutation = permutations[0] // san francisco, silicon valley, berkeley
        // totalPenalty = time 15 + 30 + 25 = 70; penalty -25 + 67.5; totalDistance = 0 + 25 + 62.5

        const hundredthpermutation = permutations[99] // silicon valley, Oakland Port, Palo Alto, 205
        // totalPenalty = time 30 + 20 + 35 = 85; penalty = 105 + 185; totalDistance = 50 + 70 + 120 = 240

        assert.equal(firstPermutation.permutation.length, 3)
        assert.equal(firstPermutation.permutation[0].toString(), 'San Francisco Downtown')

        assert.equal(firstPermutation.penalty, -27.5) // confirm
        assert.equal(hundredthpermutation.penalty, 205) // confirm

        // TEST WITH LESS THAN K = 3
        

        // console.log(permutations)
        console.log(permutations.length)
    })
})