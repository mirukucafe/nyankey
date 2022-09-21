import Logger from '@/services/logger.js';
import { IpFamily } from './types.js';
import config from './index.js';

const logger = new Logger('config:redis', 'gray', false);

function getRedisFamily(family?: IpFamily | number): number {
	const familyMap = {
		ipv4: 4,
		ipv6: 6,
		dual: 0,
	};
	if (typeof family === 'string' && family in familyMap) {
		return familyMap[family];
	} else if (typeof family === 'number' && Object.values(familyMap).includes(family)) {
		return family;
	}

	if (typeof family !== 'undefined') {
		logger.warn(`redis family "${family}" is invalid, defaulting to "both"`);
	}

	return 0;
}

export function getRedisOptions(keyPrefix?: string): Record<string, string | number | undefined> {
	return {
		port: config.redis.port,
		host: config.redis.host,
		family: getRedisFamily(config.redis.family),
		password: config.redis.pass,
		db: config.redis.db || 0,
		keyPrefix,
	};
}
