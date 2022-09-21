import Redis from 'ioredis';
import config from '@/config/index.js';
import { getRedisOptions } from '@/config/redis.js';

export function createConnection(): Redis.Redis {
	return new Redis(getRedisOptions(`${config.redis.prefix}:`));
}

export const subscriber = createConnection();
subscriber.subscribe(config.host);

export const redisClient = createConnection();
