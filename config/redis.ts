import env from "#start/env";
import { defineConfig } from "@adonisjs/redis";
import { InferConnections } from "@adonisjs/redis/types";

const redisConfig = defineConfig({
  // connection: "nullableRedis",
  connection: "main",
  connections: {
    main: {
      host: env.get("REDIS_HOST"),
      port: env.get("REDIS_PORT"),
      password: env.get("REDIS_PASSWORD", ""),
      db: 0,
      keyPrefix: "",
      retryStrategy(times) {
        return times > 10 ? null : times * 50;
      },
    },
    queue: {
      host: env.get("REDIS_HOST_QUEUE"),
      port: env.get("REDIS_PORT_QUEUE"),
      password: env.get("REDIS_PASSWORD_QUEUE", ""),
      db: 0,
      keyPrefix: "",
      retryStrategy(times) {
        return times > 10 ? null : times * 50;
      },
    },
    nullableRedis: {},
  },
});

export default redisConfig;

declare module "@adonisjs/redis/types" {
  export interface RedisConnections
    extends InferConnections<typeof redisConfig> {}
}
