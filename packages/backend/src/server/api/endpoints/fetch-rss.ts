import Parser from 'rss-parser';
import { getResponse } from '@/misc/fetch.js';
import config from '@/config/index.js';
import define from '@/server/api/define.js';

const rssParser = new Parser();

export const meta = {
	tags: ['meta'],

	requireCredential: true,
	allowGet: true,
	cacheSec: 60 * 3, // 3min

	res: {
		type: 'object',
		properties: {
			feedUrl: {
				type: 'string',
				optional: true,
			},
			title: {
				type: 'string',
				optional: true,
			},
			description: {
				type: 'string',
				optional: true,
			},
			generator: {
				type: 'string',
				description: 'The application used to generate the feed (self-proclaimed).',
				optional: true,
			},
			link: {
				type: 'string',
				optional: true,
			},
			lastBuildDate: {
				type: 'string',
				description: 'The last update timestamp, in ISO 8601 format.',
				optional: true,
			},
			items: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						title: {
							type: 'string',
							optional: true,
						},
						link: {
							type: 'string',
							optional: true,
						},
						creator: {
							type: 'string',
							description: 'The author of this feed item.',
							optional: true,
						},
						content: {
							type: 'string',
							description: 'Content of the feed item, which possibly contains HTML.',
							optional: true,
						},
						contentSnippet: {
							type: 'string',
							description: 'The same as `content` but with HTML markup and unescaped HTML entities removed. (best effort, not guaranteed to work)',
							optional: true,
						},
						guid: {
							type: 'string',
							optional: true,
						},
						isoDate: {
							type: 'string',
							description: 'The publication date, in ISO 8601 format.',
							optional: true,
						},
					},
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		url: { type: 'string' },
	},
	required: ['url'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	const res = await getResponse({
		url: ps.url,
		method: 'GET',
		headers: Object.assign({
			'User-Agent': config.userAgent,
			Accept: 'application/rss+xml, */*',
		}),
		timeout: 5000,
	});

	const text = await res.text();

	return rssParser.parseString(text);
});
