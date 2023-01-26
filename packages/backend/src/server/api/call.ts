import { performance } from 'perf_hooks';
import Koa from 'koa';
import { CacheableLocalUser } from '@/models/entities/user.js';
import { AccessToken } from '@/models/entities/access-token.js';
import { getIpHash } from '@/misc/get-ip-hash.js';
import { limiter } from './limiter.js';
import endpoints, { IEndpointMeta } from './endpoints.js';
import { ApiError } from './error.js';
import { apiLogger } from './logger.js';

export default async (endpoint: string, user: CacheableLocalUser | null | undefined, token: AccessToken | null | undefined, data: any, ctx?: Koa.Context) => {
	const isSecure = user != null && token == null;
	const isModerator = user != null && (user.isModerator || user.isAdmin);

	const ep = endpoints.find(e => e.name === endpoint);

	if (ep == null) throw new ApiError('NO_SUCH_ENDPOINT');

	if (ep.meta.secure && !isSecure) {
		throw new ApiError('ACCESS_DENIED', 'This operation can only be performed with a native token.');
	}

	if (ep.meta.limit && !isModerator) {
		// koa will automatically load the `X-Forwarded-For` header if `proxy: true` is configured in the app.
		let limitActor: string;
		if (user) {
			limitActor = user.id;
		} else {
			limitActor = getIpHash(ctx!.ip);
		}

		const limit = Object.assign({}, ep.meta.limit);

		if (!limit.key) {
			limit.key = ep.name;
		}

		// Rate limit, may throw an ApiError
		await limiter(limit as IEndpointMeta['limit'] & { key: NonNullable<string> }, limitActor);
	}

	if (ep.meta.requireCredential && user == null) {
		throw new ApiError('AUTHENTICATION_REQUIRED');
	}

	if (ep.meta.requireCredential && user!.isSuspended) {
		throw new ApiError('SUSPENDED');
	}

	if (ep.meta.requireAdmin && !user!.isAdmin) {
		throw new ApiError('ACCESS_DENIED', 'This operation requires administrator privileges.');
	}

	if (ep.meta.requireModerator && !isModerator) {
		throw new ApiError('ACCESS_DENIED', 'This operation requires moderator privileges.');
	}

	if (token && ep.meta.kind && !token.permission.some(p => p === ep.meta.kind)) {
		throw new ApiError('ACCESS_DENIED', 'This operation requires privileges which this token does not grant.');
	}

	// Cast non JSON input
	if ((ep.meta.requireFile || ctx?.method === 'GET') && ep.params.properties) {
		for (const k of Object.keys(ep.params.properties)) {
			const param = ep.params.properties![k];
			if (['boolean', 'number', 'integer'].includes(param.type ?? '') && typeof data[k] === 'string') {
				try {
					data[k] = JSON.parse(data[k]);
				} catch (e) {
					throw new ApiError('INVALID_PARAM', {
						param: k,
						reason: `cannot cast to ${param.type}`,
					});
				}
			}
		}
	}

	// API invoking
	const before = performance.now();
	return await ep.exec(data, user, token, ctx?.file).catch((e: Error) => {
		if (e instanceof ApiError) {
			throw e;
		} else {
			apiLogger.error(`Internal error occurred in ${ep.name}: ${e.message}`, {
				ep: ep.name,
				ps: data,
				e: {
					message: e.message,
					code: e.name,
					stack: e.stack,
				},
			});
			throw new ApiError('INTERNAL_ERROR', {
				e: {
					message: e.message,
					code: e.name,
					stack: e.stack,
				},
			});
		}
	}).finally(() => {
		const after = performance.now();
		const time = after - before;
		if (time > 1000) {
			apiLogger.warn(`SLOW API CALL DETECTED: ${ep.name} (${time}ms)`);
		}
	});
};
