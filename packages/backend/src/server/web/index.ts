/**
 * Web Client Server
 */

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import Koa from 'koa';
import Router from '@koa/router';
import send from 'koa-send';
import favicon from 'koa-favicon';
import views from 'koa-views';
import sharp from 'sharp';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter.js';
import { KoaAdapter } from '@bull-board/koa';

import { In, IsNull } from 'typeorm';
import { fetchMeta } from '@/misc/fetch-meta.js';
import config from '@/config/index.js';
import { Users, Notes, UserProfiles, Pages, Channels, Clips, DriveFiles } from '@/models/index.js';
import * as Acct from '@/misc/acct.js';
import { getNoteSummary } from '@/misc/get-note-summary.js';
import { queues } from '@/queue/queues.js';
import { MINUTE, DAY } from '@/const.js';
import { genOpenapiSpec } from '../api/openapi/gen-spec.js';
import { urlPreviewHandler } from './url-preview.js';
import { manifestHandler } from './manifest.js';
import { packFeed } from './feed.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const staticAssets = `${_dirname}/../../../assets/`;
const clientAssets = `${_dirname}/../../../../client/assets/`;
const assets = `${_dirname}/../../../../../built/_client_dist_/`;
const swAssets = `${_dirname}/../../../../../built/_sw_dist_/`;

// Init app
const app = new Koa();

//#region Bull Dashboard
const bullBoardPath = '/queue';

// Authenticate
app.use(async (ctx, next) => {
	if (ctx.path === bullBoardPath || ctx.path.startsWith(bullBoardPath + '/')) {
		const token = ctx.cookies.get('token');
		if (token == null) {
			ctx.status = 401;
			return;
		}
		const user = await Users.findOneBy({ token });
		if (user == null || !(user.isAdmin || user.isModerator)) {
			ctx.status = 403;
			return;
		}
	}
	await next();
});

const serverAdapter = new KoaAdapter();

createBullBoard({
	queues: queues.map(q => new BullAdapter(q)),
	serverAdapter,
});

serverAdapter.setBasePath(bullBoardPath);
app.use(serverAdapter.registerPlugin());
//#endregion

// Init renderer
app.use(views(_dirname + '/views', {
	extension: 'pug',
	options: {
		version: config.version,
		getClientEntry: () => process.env.NODE_ENV === 'production' ?
			config.clientEntry :
			JSON.parse(readFileSync(`${_dirname}/../../../../../built/_client_dist_/manifest.json`, 'utf-8'))['src/init.ts'],
		config,
	},
}));

// Serve favicon
app.use(favicon(`${_dirname}/../../../assets/favicon.ico`));

// Common request handler
app.use(async (ctx, next) => {
	// IFrameの中に入れられないようにする
	ctx.set('X-Frame-Options', 'DENY');
	await next();
});

// Init router
const router = new Router();

//#region static assets

router.get('/static-assets/(.*)', async ctx => {
	await send(ctx as any, ctx.path.replace('/static-assets/', ''), {
		root: staticAssets,
		maxage: 7 * DAY,
	});
});

router.get('/client-assets/(.*)', async ctx => {
	await send(ctx as any, ctx.path.replace('/client-assets/', ''), {
		root: clientAssets,
		maxage: 7 * DAY,
	});
});

router.get('/assets/(.*)', async ctx => {
	await send(ctx as any, ctx.path.replace('/assets/', ''), {
		root: assets,
		maxage: 7 * DAY,
	});
});

// Apple touch icon
router.get('/apple-touch-icon.png', async ctx => {
	await send(ctx as any, '/apple-touch-icon.png', {
		root: staticAssets,
	});
});

router.get('/twemoji/(.*)', async ctx => {
	const path = ctx.path.replace('/twemoji/', '');

	if (!path.match(/^[0-9a-f-]+\.svg$/)) {
		ctx.status = 404;
		return;
	}

	ctx.set('Content-Security-Policy', 'default-src \'none\'; style-src \'unsafe-inline\'');

	await send(ctx as any, path, {
		root: `${_dirname}/../../../../../node_modules/@discordapp/twemoji/dist/svg/`,
		maxage: 30 * DAY,
	});
});

router.get('/twemoji-badge/(.*)', async ctx => {
	const path = ctx.path.replace('/twemoji-badge/', '');

	if (!path.match(/^[0-9a-f-]+\.png$/)) {
		ctx.status = 404;
		return;
	}

	const mask = await sharp(
		`${_dirname}/../../../../../node_modules/@discordapp/twemoji/dist/svg/${path.replace('.png', '')}.svg`,
		{ density: 1000 },
	)
		.resize(488, 488)
		.greyscale()
		.normalise()
		.linear(1.75, -(128 * 1.75) + 128) // 1.75x contrast
		.flatten({ background: '#000' })
		.extend({
			top: 12,
			bottom: 12,
			left: 12,
			right: 12,
			background: '#000',
		})
		.toColorspace('b-w')
		.png()
		.toBuffer();

	const buffer = await sharp({
		create: { width: 512, height: 512, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
	})
		.pipelineColorspace('b-w')
		.boolean(mask, 'eor')
		.resize(96, 96)
		.png()
		.toBuffer();

	ctx.set('Content-Security-Policy', 'default-src \'none\'; style-src \'unsafe-inline\'');
	ctx.set('Cache-Control', 'max-age=2592000');
	ctx.set('Content-Type', 'image/png');
	ctx.body = buffer;
});

// ServiceWorker
router.get('/sw.js', async ctx => {
	await send(ctx as any, '/sw.js', {
		root: swAssets,
		maxage: 10 * MINUTE,
	});
});

// Manifest
router.get('/manifest.json', manifestHandler);

router.get('/robots.txt', async ctx => {
	await send(ctx as any, '/robots.txt', {
		root: staticAssets,
	});
});

//#endregion

// Docs
router.get('/api-doc', async ctx => {
	await send(ctx as any, '/redoc.html', {
		root: staticAssets,
	});
});

// URL preview endpoint
router.get('/url', urlPreviewHandler);

router.get('/api.json', async ctx => {
	ctx.body = genOpenapiSpec();
});

const getFeed = async (acct: string) => {
	const { username, host } = Acct.parse(acct);
	const user = await Users.findOneBy({
		usernameLower: username.toLowerCase(),
		host: host ?? IsNull(),
		isSuspended: false,
		isDeleted: IsNull(),
	});

	return user && await packFeed(user);
};

// Atom
router.get('/@:user.atom', async ctx => {
	const feed = await getFeed(ctx.params.user);

	if (feed) {
		ctx.set('Content-Type', 'application/atom+xml; charset=utf-8');
		ctx.body = feed.atom1();
	} else {
		ctx.status = 404;
	}
});

// RSS
router.get('/@:user.rss', async ctx => {
	const feed = await getFeed(ctx.params.user);

	if (feed) {
		ctx.set('Content-Type', 'application/rss+xml; charset=utf-8');
		ctx.body = feed.rss2();
	} else {
		ctx.status = 404;
	}
});

// JSON
router.get('/@:user.json', async ctx => {
	const feed = await getFeed(ctx.params.user);

	if (feed) {
		ctx.set('Content-Type', 'application/json; charset=utf-8');
		ctx.body = feed.json1();
	} else {
		ctx.status = 404;
	}
});

//#region SSR (for crawlers)
// User
router.get(['/@:user', '/@:user/:sub'], async (ctx, next) => {
	const { username, host } = Acct.parse(ctx.params.user);
	const user = await Users.findOneBy({
		usernameLower: username.toLowerCase(),
		host: host ?? IsNull(),
		isSuspended: false,
		isDeleted: IsNull(),
	});

	if (user != null) {
		const profile = await UserProfiles.findOneByOrFail({ userId: user.id });
		const meta = await fetchMeta();
		const me = profile.fields
			? profile.fields
				.filter(filed => filed.value != null && filed.value.match(/^https?:/))
				.map(field => field.value)
			: [];

		await ctx.render('user', {
			user, profile, me,
			avatarUrl: await Users.getAvatarUrl(user),
			sub: ctx.params.sub,
			instanceName: meta.name || 'FoundKey',
			icon: meta.iconUrl,
			themeColor: meta.themeColor,
		});
		ctx.set('Cache-Control', 'public, max-age=15');
	} else {
		// リモートユーザーなので
		// モデレータがAPI経由で参照可能にするために404にはしない
		await next();
	}
});

router.get('/users/:user', async ctx => {
	const user = await Users.findOneBy({
		id: ctx.params.user,
		host: IsNull(),
		isSuspended: false,
		isDeleted: IsNull(),
	});

	if (user == null) {
		ctx.status = 404;
		return;
	}

	ctx.redirect(`/@${user.username}${ user.host == null ? '' : '@' + user.host}`);
});

// Note
router.get('/notes/:note', async (ctx, next) => {
	const note = await Notes.findOneBy({
		id: ctx.params.note,
		visibility: In(['public', 'home']),
	});

	if (note) {
		try {
			// FIXME: packing with detail may throw an error if the reply or renote is not visible (#8774)
			const packedNote = await Notes.pack(note);
			const profile = await UserProfiles.findOneByOrFail({ userId: note.userId });
			const meta = await fetchMeta();

			// If the note has a CW (is sensitive as a whole) or any of the files is sensitive or there are no
			// files, they are not used for a preview.
			let filesOpengraph = [];
			if (!packedNote.cw || packedNote.files.length > 0 || packedNote.files.every(file => !file.isSensitive)) {
				let limit = 4;
				for (const file of packedNote.files) {
					if (file.type.startsWith('image/')) {
						filesOpengraph.push([
							"og:image",
							DriveFiles.getPublicUrl(file, true),
						]);
						filesOpengraph.push([
							"og:image:type",
							file.type,
						]);
						if (file.properties != null) {
							filesOpengraph.push([
								"og:image:width",
								file.properties?.width,
							]);
							filesOpengraph.push([
								"og:image:height",
								file.properties?.height,
							]);
						}
						if (file.comment) {
							filesOpengraph.push([
								"og:image:alt",
								file.comment,
							]);
						}
					} else if (file.type.startsWith('audio/')) {
						filesOpengraph.push([
							"og:audio",
							DriveFiles.getPublicUrl(file),
						]);
						filesOpengraph.push([
							"og:audio:type",
							file.type,
						]);
					} else if (file.type.startsWith('video/')) {
						filesOpengraph.push([
							"og:video",
							DriveFiles.getPublicUrl(file),
						]);
						filesOpengraph.push([
							"og:video:type",
							file.type,
						]);
					} else {
						// doesn't count towards the limit
						continue;
					}

					// limit the number of presented attachments
					if (--limit < 0) break;
				}
			}

			await ctx.render('note', {
				note: packedNote,
				profile,
				filesOpengraph,
				// TODO: Let locale changeable by instance setting
				summary: getNoteSummary(packedNote),
				instanceName: meta.name || 'FoundKey',
				icon: meta.iconUrl,
				themeColor: meta.themeColor,
			});

			ctx.set('Cache-Control', 'public, max-age=15');

			return;
		} catch (err) {
			if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') {
				// note not visible to user
			} else {
				throw err;
			}
		}
	}

	await next();
});

// Page
router.get('/@:user/pages/:page', async (ctx, next) => {
	const { username, host } = Acct.parse(ctx.params.user);
	const user = await Users.findOneBy({
		usernameLower: username.toLowerCase(),
		host: host ?? IsNull(),
		isSuspended: false,
		isDeleted: IsNull(),
	});

	if (user == null) return;

	const page = await Pages.findOneBy({
		name: ctx.params.page,
		userId: user.id,
	});

	if (page) {
		const _page = await Pages.pack(page);
		const profile = await UserProfiles.findOneByOrFail({ userId: page.userId });
		const meta = await fetchMeta();
		await ctx.render('page', {
			page: _page,
			profile,
			avatarUrl: await Users.getAvatarUrl(await Users.findOneByOrFail({ id: page.userId })),
			instanceName: meta.name || 'FoundKey',
			icon: meta.iconUrl,
			themeColor: meta.themeColor,
		});

		if (['public'].includes(page.visibility)) {
			ctx.set('Cache-Control', 'public, max-age=15');
		} else {
			ctx.set('Cache-Control', 'private, max-age=0, must-revalidate');
		}

		return;
	}

	await next();
});

// Clip
// TODO: 非publicなclipのハンドリング
router.get('/clips/:clip', async (ctx, next) => {
	const clip = await Clips.findOneBy({
		id: ctx.params.clip,
	});

	if (clip) {
		const _clip = await Clips.pack(clip);
		const profile = await UserProfiles.findOneByOrFail({ userId: clip.userId });
		const meta = await fetchMeta();
		await ctx.render('clip', {
			clip: _clip,
			profile,
			avatarUrl: await Users.getAvatarUrl(await Users.findOneByOrFail({ id: clip.userId })),
			instanceName: meta.name || 'FoundKey',
			icon: meta.iconUrl,
			themeColor: meta.themeColor,
		});

		ctx.set('Cache-Control', 'public, max-age=15');

		return;
	}

	await next();
});

// Channel
router.get('/channels/:channel', async (ctx, next) => {
	const channel = await Channels.findOneBy({
		id: ctx.params.channel,
	});

	if (channel) {
		const _channel = await Channels.pack(channel);
		const meta = await fetchMeta();
		await ctx.render('channel', {
			channel: _channel,
			instanceName: meta.name || 'FoundKey',
			icon: meta.iconUrl,
			themeColor: meta.themeColor,
		});

		ctx.set('Cache-Control', 'public, max-age=15');

		return;
	}

	await next();
});
//#endregion

router.get('/_info_card_', async ctx => {
	const meta = await fetchMeta(true);

	ctx.remove('X-Frame-Options');

	await ctx.render('info-card', {
		version: config.version,
		host: config.host,
		meta,
		originalUsersCount: await Users.countBy({ host: IsNull() }),
		originalNotesCount: await Notes.countBy({ userHost: IsNull() }),
	});
});

router.get('/flush', async ctx => {
	await ctx.render('flush');
});

// streamingに非WebSocketリクエストが来た場合にbase htmlをキャシュ付きで返すと、Proxy等でそのパスがキャッシュされておかしくなる
router.get('/streaming', async ctx => {
	ctx.status = 503;
	ctx.set('Cache-Control', 'private, max-age=0');
});

// Render base html for all requests
router.get('(.*)', async ctx => {
	const meta = await fetchMeta();
	await ctx.render('base', {
		img: meta.bannerUrl,
		title: meta.name || 'FoundKey',
		instanceName: meta.name || 'FoundKey',
		desc: meta.description,
		icon: meta.iconUrl,
		themeColor: meta.themeColor,
	});
	ctx.set('Cache-Control', 'public, max-age=15');
});

// Register router
app.use(router.routes());

export default app;
