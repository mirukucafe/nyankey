import Redis from 'ioredis';
import config from '@/config/index.js';

export function createConnection() {
	return new Redis({
		port: config.redis.port,
		host: config.redis.host,
		family: config.redis.family ?? 0,
		password: config.redis.pass,
		keyPrefix: `${config.redis.prefix}:`,
		db: config.redis.db || 0,
	});
}

export const subscriber = createConnection();
subscriber.subscribe(config.host);

export const redisClient = createConnection();
