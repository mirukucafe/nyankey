/**
 * API Server
 */

import Koa from 'koa';
import Router from '@koa/router';
import multer from '@koa/multer';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';

import { Instances, AccessTokens, Users } from '@/models/index.js';
import config from '@/config/index.js';
import endpoints from './endpoints.js';
import { handler } from './api-handler.js';
import signup from './private/signup.js';
import signin from './private/signin.js';
import signupPending from './private/signup-pending.js';
import { oauth } from './common/oauth.js';
import { ApiError } from './error.js';

// Init app
const app = new Koa();

app.use(cors({
	origin: '*',
}));

// No caching
app.use(async (ctx, next) => {
	ctx.set('Cache-Control', 'private, max-age=0, must-revalidate');
	await next();
});

app.use(bodyParser());

// Init multer instance
const upload = multer({
	storage: multer.diskStorage({}),
	limits: {
		fileSize: config.maxFileSize || 262144000,
		files: 1,
	},
});
/**
 * Wrap multer to return an appropriate API error when something goes wrong, e.g. the file is too big.
 */
type KoaMiddleware = (ctx: Koa.Context, next: () => Promise<void>) => Promise<void>;
const wrapped = upload.single('file');
function uploadWrapper(endpoint: string): KoaMiddleware {
	return (ctx: Koa.Context, next: () => Promise<void>): Promise<void> => {
		// pass a fake "next" so we can separate multer errors from other API errors
		return wrapped(ctx, () => {})
			.then(
				() => next(),
				(err) => {
					let apiErr = new ApiError('INTERNAL_ERROR', err);
					if (err?.code === 'LIMIT_FILE_SIZE') {
						apiErr = new ApiError('FILE_TOO_BIG', { maxFileSize: config.maxFileSize || 262144000 });
					}
					apiErr.apply(ctx, endpoint);
				},
			);
	};
}

// Init router
const router = new Router();

/**
 * Register endpoint handlers
 */
for (const endpoint of endpoints) {
	if (endpoint.meta.requireFile) {
		router.post(`/${endpoint.name}`, uploadWrapper(endpoint.name), handler.bind(null, endpoint));
	} else {
		// 後方互換性のため
		if (endpoint.name.includes('-')) {
			router.post(`/${endpoint.name.replace(/-/g, '_')}`, handler.bind(null, endpoint));

			if (endpoint.meta.allowGet) {
				router.get(`/${endpoint.name.replace(/-/g, '_')}`, handler.bind(null, endpoint));
			} else {
				router.get(`/${endpoint.name.replace(/-/g, '_')}`, async ctx => { ctx.status = 405; });
			}
		}

		router.post(`/${endpoint.name}`, handler.bind(null, endpoint));

		if (endpoint.meta.allowGet) {
			router.get(`/${endpoint.name}`, handler.bind(null, endpoint));
		} else {
			router.get(`/${endpoint.name}`, async ctx => { ctx.status = 405; });
		}

		if (endpoint.meta.v2) {
			const path = endpoint.meta.v2.alias ?? endpoint.name.replace(/-/g, '_');
			router[endpoint.meta.v2.method](`/v2/${path}`, handler.bind(null, endpoint));
		}
	}
}

// the OAuth endpoint does some shenanigans and can not use the normal API handler
router.post('/auth/session/oauth', oauth);

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/signup-pending', signupPending);

router.get('/v1/instance/peers', async ctx => {
	const instances = await Instances.find({
		select: ['host'],
	});

	ctx.body = instances.map(instance => instance.host);
});

router.post('/miauth/:session/check', async ctx => {
	const token = await AccessTokens.findOneBy({
		session: ctx.params.session,
	});

	if (token && token.session != null && !token.fetched) {
		AccessTokens.update(token.id, {
			fetched: true,
		});

		ctx.body = {
			ok: true,
			token: token.token,
			user: await Users.pack(token.userId, null, { detail: true }),
		};
	} else {
		ctx.body = {
			ok: false,
		};
	}
});

// Return 404 for unknown API
router.all('(.*)', async ctx => {
	ctx.status = 404;
});

// Register router
app.use(router.routes());

export default app;
