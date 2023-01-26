import Limiter from 'ratelimiter';
import Logger from '@/services/logger.js';
import { redisClient } from '@/db/redis.js';
import { IEndpointMeta } from './endpoints.js';
import { ApiError } from './error.js';

const logger = new Logger('limiter');

export const limiter = (limitation: IEndpointMeta['limit'] & { key: NonNullable<string> }, actor: string) => new Promise<void>((resolve) => {
	if (process.env.NODE_ENV === 'test') resolve();

	const hasShortTermLimit = typeof limitation.minInterval === 'number';

	const hasLongTermLimit =
		typeof limitation.duration === 'number' &&
		typeof limitation.max === 'number';

	if (hasShortTermLimit) {
		min();
	} else if (hasLongTermLimit) {
		max();
	} else {
		resolve();
	}

	// Short-term limit, calls long term limit if appropriate.
	function min(): void {
		const minIntervalLimiter = new Limiter({
			id: `${actor}:${limitation.key}:min`,
			duration: limitation.minInterval,
			max: 1,
			db: redisClient,
		});

		minIntervalLimiter.get((err, info) => {
			if (err) {
				logger.error(err);
				throw new ApiError('INTERNAL_ERROR');
			}

			logger.debug(`${actor} ${limitation.key} min remaining: ${info.remaining}`);

			if (info.remaining === 0) {
				throw new ApiError('RATE_LIMIT_EXCEEDED', info);
			} else {
				if (hasLongTermLimit) {
					max();
				} else {
					resolve();
				}
			}
		});
	}

	// Long term limit
	function max(): void {
		const limiter = new Limiter({
			id: `${actor}:${limitation.key}`,
			duration: limitation.duration,
			max: limitation.max,
			db: redisClient,
		});

		limiter.get((err, info) => {
			if (err) {
				logger.error(err);
				throw new ApiError('INTERNAL_ERROR');
			}

			logger.debug(`${actor} ${limitation.key} max remaining: ${info.remaining}`);

			if (info.remaining === 0) {
				throw new ApiError('RATE_LIMIT_EXCEEDED', info);
			} else {
				resolve();
			}
		});
	}
});
