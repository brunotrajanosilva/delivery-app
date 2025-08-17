import { Queue } from 'bullmq'
import redisConfig from '#config/redis'

const myQueue = new Queue('order', { connection: redisConfig.connections.queue })

export default myQueue

// async function addJobs() {
//   await myQueue.add('myJobName', { foo: 'bar' })
//   await myQueue.add('myJobName', { qux: 'baz' })
// }

// await addJobs()
