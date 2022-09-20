import Redis from 'ioredis';
import config from '@/config/index.js';
import { IpFamily } from '@/config/types.js';

function getRedisFamily(family?: IpFamily | number): number {
	switch (family) {
		case 'ipv4': return 4;
		case 'ipv6': return 6;
		case 'dual': return 0;
		default: return family ?? 0;
	}
}

export function createConnection(): Redis.Redis {
	return new Redis({
		port: config.redis.port,
		host: config.redis.host,
		family: getRedisFamily(config.redis.family),
		password: config.redis.pass,
		keyPrefix: `${config.redis.prefix}:`,
		db: config.redis.db || 0,
	});
}

export const subscriber = createConnection();
subscriber.subscribe(config.host);

export const redisClient = createConnection();
