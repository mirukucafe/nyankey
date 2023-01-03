import { promisify } from 'node:util';
import redisLock from 'redis-lock';
import { redisClient } from '@/db/redis.js';
import { SECOND } from '@/const.js';

/**
 * Retry delay (ms) for lock acquisition
 */
const retryDelay = 100;

const lock: (key: string, timeout?: number) => Promise<() => void> = promisify(redisLock(redisClient, retryDelay));

/**
 * Get AP Object lock
 * @param uri AP object ID
 * @param timeout Lock timeout (ms), The timeout releases previous lock.
 * @returns Unlock function
 */
export function getApLock(uri: string, timeout = 30 * SECOND) {
	return lock(`ap-object:${uri}`, timeout);
}

export function getFetchInstanceMetadataLock(host: string, timeout = 30 * SECOND) {
	return lock(`instance:${host}`, timeout);
}

export function getChartInsertLock(lockKey: string, timeout = 30 * SECOND) {
	return lock(`chart-insert:${lockKey}`, timeout);
}
