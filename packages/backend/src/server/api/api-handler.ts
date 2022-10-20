import Koa from 'koa';

import { IEndpoint } from './endpoints.js';
import authenticate, { AuthenticationError } from './authenticate.js';
import call from './call.js';
import { ApiError } from './error.js';

export async function handler(endpoint: IEndpoint, ctx: Koa.Context): Promise<void> {
	const body = ctx.is('multipart/form-data')
		? (ctx.request as any).body
		: ctx.method === 'GET'
			? ctx.query
			: ctx.request.body;

	const error = (e: ApiError): void => {
		ctx.status = e.httpStatusCode;
		if (e.httpStatusCode === 401) {
			ctx.response.set('WWW-Authenticate', 'Bearer');
		}
		ctx.body = {
			error: {
				message: e!.message,
				code: e!.code,
				...(e!.info ? { info: e!.info } : {}),
				endpoint: endpoint.name,
			},
		};
	}

	// Authentication
	// for GET requests, do not even pass on the body parameter as it is considered unsafe
	await authenticate(ctx.headers.authorization, ctx.method === 'GET' ? null : body['i']).then(async ([user, app]) => {
		// API invoking
		await call(endpoint.name, user, app, body, ctx).then((res: any) => {
			if (ctx.method === 'GET' && endpoint.meta.cacheSec && !body['i'] && !user) {
				ctx.set('Cache-Control', `public, max-age=${endpoint.meta.cacheSec}`);
			}
			if (res == null) {
				ctx.status = 204;
			} else {
				ctx.status = 200;
				// If a string is returned, it must be passed through JSON.stringify to be recognized as JSON.
				ctx.body = typeof res === 'string' ? JSON.stringify(res) : res;
			}
		}).catch((e: ApiError) => {
			error(e);
		});
	}).catch(e => {
		if (e instanceof AuthenticationError) {
			error(new ApiError('AUTHENTICATION_FAILED', e.message));
		} else {
			error(new ApiError());
		}
	});
};
