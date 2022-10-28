import { Pages, PageLikes } from '@/models/index.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['pages'],

	requireCredential: true,

	kind: 'write:page-likes',

	errors: ['NO_SUCH_PAGE', 'NOT_LIKED'],
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

	const exist = await PageLikes.findOneBy({
		pageId: page.id,
		userId: user.id,
	});

	if (exist == null) throw new ApiError('NOT_LIKED');

	// Delete like
	await PageLikes.delete(exist.id);

	Pages.decrement({ id: page.id }, 'likedCount', 1);
});
