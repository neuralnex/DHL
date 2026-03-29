import IORedis, { type RedisOptions } from "ioredis";

let connection: IORedis | null = null;

function redisOptions(): RedisOptions {
  return {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    retryStrategy(times: number) {
      if (times > 5) return null;
      return Math.min(times * 150, 2000);
    },
  };
}

export function getRedisConnection(): IORedis {
  if (connection) return connection;
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not set");
  }
  connection = new IORedis(url, redisOptions());
  return connection;
}
