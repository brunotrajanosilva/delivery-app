import NodeGeocoder from 'node-geocoder'
import { getDistance } from 'geolib'

export type Location = {
  latitude: number
  longitude: number
}

export default class LocationHelper {
  private geocoder: NodeGeocoder.Geocoder

  constructor(options?: NodeGeocoder.Options) {
    this.geocoder = NodeGeocoder(options || { provider: 'openstreetmap' })
  }

  public async getGeoLocatorFromAddress(address: string): Promise<Location> {
    const geoLocation = await this.geocoder.geocode(address)
    if (
      !geoLocation ||
      geoLocation.length === 0 ||
      geoLocation[0].latitude === undefined ||
      geoLocation[0].longitude === undefined
    ) {
      throw new Error('Location not found for address: ' + address)
    }
    return {
      latitude: geoLocation[0].latitude,
      longitude: geoLocation[0].longitude,
    }
  }

  public getDistanceKm(startLocation: Location, endLocation: Location): number {
    const distanceMeters = getDistance(startLocation, endLocation)
    return Math.round(distanceMeters / 1000) // Convert meters to kilometers
  }
}
