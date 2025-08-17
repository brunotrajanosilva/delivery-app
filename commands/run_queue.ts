import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Worker, Job } from 'bullmq'
import redisConfig from '#config/redis'
export default class RunQueue extends BaseCommand {
  static commandName = 'run:queue'
  static description = ''

  static options: CommandOptions = {}

  async run() {
    this.logger.info('Hello world from "RunQueue"')
    const worker = new Worker(
      'order',
      async (job: Job) => {
        // The processor function is where the job logic goes.
        // This function is executed for every job added to 'my_queue'.
        this.logger.info(`Processing job ${job.id} with data: ${JSON.stringify(job.data)}`)

        // Add your job processing logic here. For example, sending an email.
        // await Mail.send(...)
        // Delay the job processing by 15 seconds
        await new Promise((resolve) => setTimeout(resolve, 15000))

        // Example of handling different job types.
        if (job.name === 'send_email') {
          const { recipient, subject, body } = job.data
          // Your logic to send the email
          this.logger.success(
            `Email sent to ${recipient} with subject "${subject}. Message: ${body}"`
          )
        } else {
          this.logger.warning(`Unknown job type: ${job.name}`)
        }

        // You can return a value which will be stored as the job's result.
        return { status: 'completed', result: 'Job processed successfully' }
      },
      {
        // Worker options
        connection: redisConfig.connections.queue, // Use your Redis connection
      }
    )

    // Listen for worker events to log and monitor its activity.
    worker.on('completed', (job) => {
      this.logger.success(`Job ${job.id} has completed!`)
    })

    worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed with error: ${err.message}`)
    })

    worker.on('error', (err) => {
      this.logger.error(`Worker error: ${err.message}`)
    })

    // This command will stay alive as long as the worker is running,
    // so you can keep it running in a separate process.
    this.logger.success('BullMQ worker is running and listening for jobs...')
  }
}
