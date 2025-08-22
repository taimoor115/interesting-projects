const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableOfflineQueue: true,
  lazyConnect: false,
});

redis.on("error", (e) => console.error("Redis error:", e.message));
module.exports = redis;
