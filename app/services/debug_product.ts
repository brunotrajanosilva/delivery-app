// app/services/test_debug.ts
import Product from '#models/product'

export default class TestDebugService {
  static async testProductFind() {
    const result = await Product.find(1)
    console.log('TestDebugService:', result)
    return result
  }
}
