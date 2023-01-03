import { Pages, PageLikes } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['pages'],

	requireCredential: true,

	kind: 'write:page-likes',

	errors: ['ALREADY_LIKED', 'NO_SUCH_PAGE'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		pageId: { type: 'string', format: 'misskey:id' },
	},
	required: ['pageId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const page = await Pages.findOneBy({ id: ps.pageId });
	if (page == null) throw new ApiError('NO_SUCH_PAGE');

	// if already liked
	const exist = await PageLikes.countBy({
		pageId: page.id,
		userId: user.id,
	});

	if (exist) throw new ApiError('ALREADY_LIKED');

	// Create like
	await PageLikes.insert({
		id: genId(),
		createdAt: new Date(),
		pageId: page.id,
		userId: user.id,
	});

	Pages.increment({ id: page.id }, 'likedCount', 1);
});
