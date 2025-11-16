import { ApplicationService } from "@adonisjs/core/types";
import { Queue } from "bullmq";
import redisConfig from "#config/redis";

export default class QueueProvider {
  constructor(protected app: ApplicationService) {}

  public register() {
    this.app.container.singleton(Queue, () => {
      const connectionQueue = { connection: redisConfig.connections.queue };
      const orderQueue = new Queue("order", connectionQueue);

      return orderQueue;
    });
  }
}
