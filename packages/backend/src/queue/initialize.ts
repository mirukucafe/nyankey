import Bull from 'bull';
import { SECOND, MINUTE, HOUR } from '@/const.js';
import config from '@/config/index.js';
import { getRedisOptions } from '@/config/redis.js';

export function initialize<T>(name: string, limitPerSec = -1): Bull.Queue<T> {
	return new Bull<T>(name, {
		redis: getRedisOptions(),
		prefix: config.redis.prefix ? `${config.redis.prefix}:queue` : 'queue',
		limiter: limitPerSec > 0 ? {
			max: limitPerSec,
			duration: SECOND,
		} : undefined,
		settings: {
			backoffStrategies: {
				apBackoff,
			},
		},
	});
}

// ref. https://github.com/misskey-dev/misskey/pull/7635#issue-971097019
function apBackoff(attemptsMade: number /*, err: Error */): number {
	const baseDelay = MINUTE;
	const maxBackoff = 8 * HOUR;
	let backoff = (Math.pow(2, attemptsMade) - 1) * baseDelay;
	backoff = Math.min(backoff, maxBackoff);
	backoff += Math.round(backoff * Math.random() * 0.2);
	return backoff;
}
