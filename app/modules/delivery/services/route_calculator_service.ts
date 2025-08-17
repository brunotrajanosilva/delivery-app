
import DeliveryOrder from "#models/delivery/delivery_order";
import LocationHelper from "../helpers/location_helper.js";
import { DateTime } from 'luxon'


// THIS ALGO CAN BE BETTER IF THE APP NEED IT 

interface Result {
    permutation: {deliveryOrder: DeliveryOrder, routeDistance: number}[],
    penalty: number
}

// time penalty decides best routes
// in DB delivery, only distanceFromPrevious will be saved and used in realTime to calc the Time remaing

export default class RouteCalculatorService {

    private result: Result[] = []
    private readonly _locationHelper: LocationHelper
    
    constructor(locationHelper: LocationHelper) {
        this._locationHelper = locationHelper
    }

    public getPermutations = (elements: DeliveryOrder[], k: number)=>{
        // const result:Result = null // This array will store all the generated permutations
        const used = new Array(elements.length).fill(false); // To keep track of used elements
        // const now = DateTime.now()
        // let counter = 0
        // let totalDistance = 0
        // let penalty = 0

        const self = this
        
        function generatePermutations(currentPermutation: DeliveryOrder[]) {
            // counter++
            // Base case: If the current permutation has k elements, it's complete.
            if (currentPermutation.length === k) {
                const permutationResult = self.calcPenalty(currentPermutation)
                self.result.push(permutationResult)
                // result.push([...currentPermutation]) // Add a copy of the permutation to the results

                return // Stop recursion for this path
            }
        
            // Recursive step: Iterate through all elements.
            for (let i = 0; i < elements.length; i++) {
                // Only use an element if it hasn't been used in the current permutation
                if (!used[i]) {
                    used[i] = true; // Mark as used
                    // const element = elements[i]
                    // const distanceFromPrevious = this._locationHelper.getDistanceKm( element.getLocation(), permutation[i-1].getLocation() )
                    // total += distanceFromPrevious
                    
                    // const timePenalty = now - element.createAt
                    // const distancePenalty = totalDistance - element.distanceKm


                    // const elementResult = [delivery: element, totalDistance: 0]

                    currentPermutation.push(elements[i]); // Add to current permutation
            
                    generatePermutations(currentPermutation); // Recurse

                    // -----------------
                    currentPermutation.pop(); // Backtrack: remove last added element
                    used[i] = false; // Backtrack: unmark as used
                }
            }
        }
  
        // Start the permutation generation process
        generatePermutations([]);
        // console.log(counter)
        return self.result;
    }

    private calcPenalty = (permutation: DeliveryOrder[]): Result => {
        let totalPenalty = 0
        let totalDistance = 0
        // let totalExtraDistanceKm = 0
        // let totalTime = 0
        const elements = []

        for (let i=0; i < permutation.length; i++){
            const element = permutation[i]
            const elementResult: any = {deliveryOrder: element, routeDistance: 0}

            const timePenalty = element.getTimePenalty()
            // totalTime += timePenalty
            totalPenalty -= timePenalty
            // console.log(totalPenalty)

            if (i === 0){
                totalDistance = element.distanceKm
                elementResult.routeDistance = element.distanceKm
            }
            
            if (i > 0){
                const distanceFromPrevious = this._locationHelper.getDistanceKm( element.getLocation(), permutation[i-1].getLocation() )
                totalDistance += distanceFromPrevious
                elementResult.routeDistance = totalDistance

                // can't be zero
                const extraDistanceKm = totalDistance - element.distanceKm
                // totalExtraDistanceKm += extraDistanceKm
                totalPenalty += extraDistanceKm
            }
            elements.push(elementResult)
            
            // if (this.result.length === 0){console.log(totalPenalty, totalDistance)}
            // console.log(totalPenalty)

        }
        // console.log("total: " + totalPenalty)

        // return {permutation: [...permutation], penalty: totalPenalty }
        return {permutation: elements, penalty: totalPenalty }
    }



}