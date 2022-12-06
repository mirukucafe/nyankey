import Router from '@koa/router';
import { IsNull, MoreThan } from 'typeorm';
import config from '@/config/index.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { Users, Notes } from '@/models/index.js';
import { MONTH, DAY } from '@/const.js';

const router = new Router();

const nodeinfo2_1path = '/nodeinfo/2.1';
const nodeinfo2_0path = '/nodeinfo/2.0';

export const links = [{
	rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1',
	href: config.url + nodeinfo2_1path,
}, {
	rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
	href: config.url + nodeinfo2_0path,
}];

const repository = 'https://akkoma.dev/FoundKeyGang/FoundKey';

type NodeInfo2Base = {
	software: {
		name: string;
		version: string;
		repository?: string;
	};
	protocols: string[];
	services: {
		inbound: string[];
		outbound: string[];
	};
	openRegistrations: boolean;
	usage: {
		users: {
			total: number;
			activeHalfyear: number;
			activeMonth: number;
		};
		localPosts: number;
		localComments: number;
	};
	metadata: Record<string, any>;
};

const nodeinfo2 = async (): Promise<NodeInfo2Base> => {
	const now = Date.now();
	const [
		meta,
		total,
		activeHalfyear,
		activeMonth,
		localPosts,
	] = await Promise.all([
		fetchMeta(true),
		Users.count({ where: { host: IsNull() } }),
		Users.count({ where: { host: IsNull(), lastActiveDate: MoreThan(new Date(now - 180 * DAY)) } }),
		Users.count({ where: { host: IsNull(), lastActiveDate: MoreThan(new Date(now - MONTH)) } }),
		Notes.count({ where: { userHost: IsNull() } }),
	]);

	const proxyAccount = meta.proxyAccountId ? await Users.pack(meta.proxyAccountId).catch(() => null) : null;

	return {
		software: {
			name: 'foundkey',
			version: config.version,
			repository,
		},
		protocols: ['activitypub'],
		services: {
			inbound: [] as string[],
			outbound: ['atom1.0', 'rss2.0'],
		},
		openRegistrations: !meta.disableRegistration,
		usage: {
			users: { total, activeHalfyear, activeMonth },
			localPosts,
			localComments: 0,
		},
		metadata: {
			nodeName: meta.name,
			nodeDescription: meta.description,
			maintainer: {
				name: meta.maintainerName,
				email: meta.maintainerEmail,
			},
			langs: meta.langs,
			tosUrl: meta.ToSUrl,
			repositoryUrl: repository,
			feedbackUrl: 'ircs://irc.akkoma.dev/foundkey',
			disableRegistration: meta.disableRegistration,
			disableLocalTimeline: meta.disableLocalTimeline,
			disableGlobalTimeline: meta.disableGlobalTimeline,
			emailRequiredForSignup: meta.emailRequiredForSignup,
			enableHcaptcha: meta.enableHcaptcha,
			enableRecaptcha: meta.enableRecaptcha,
			maxNoteTextLength: config.maxNoteTextLength,
			enableEmail: meta.enableEmail,
			proxyAccountName: proxyAccount?.username ?? null,
			themeColor: meta.themeColor || '#86b300',
		},
	};
};

/*
Nodeinfo is cacheable for 1 day, the parts that change are the usage statistics
and those should not be time critical.
*/
const cacheControl = 'public, max-age=86400';

router.get(nodeinfo2_1path, async ctx => {
	const base = await nodeinfo2();

	ctx.body = { version: '2.1', ...base };
	ctx.set('Cache-Control', cacheControl);
});

router.get(nodeinfo2_0path, async ctx => {
	const base = await nodeinfo2();

	delete base.software.repository;

	ctx.body = { version: '2.0', ...base };
	ctx.set('Cache-Control', cacheControl);
});

export default router;
