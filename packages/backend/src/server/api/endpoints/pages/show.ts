import { IsNull } from 'typeorm';
import { Pages, Users } from '@/models/index.js';
import { Page } from '@/models/entities/page.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['pages'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Page',
	},

	errors: ['NO_SUCH_PAGE'],
} as const;

export const paramDef = {
	type: 'object',
	anyOf: [
		{
			properties: {
				pageId: { type: 'string', format: 'misskey:id' },
			},
			required: ['pageId'],
		},
		{
			properties: {
				name: { type: 'string' },
				username: { type: 'string' },
			},
			required: ['name', 'username'],
		},
	],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	let page: Page | null = null;

	if (ps.pageId) {
		page = await Pages.findOneBy({ id: ps.pageId });
	} else if (ps.name && ps.username) {
		const author = await Users.findOneBy({
			host: IsNull(),
			usernameLower: ps.username.toLowerCase(),
		});
		if (author) {
			page = await Pages.findOneBy({
				name: ps.name,
				userId: author.id,
			});
		}
	}

	if (page == null) throw new ApiError('NO_SUCH_PAGE');

	return await Pages.pack(page, user);
});
