import { Pages } from '@/models/index.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['pages'],

	requireCredential: true,

	kind: 'write:pages',

	errors: ['NO_SUCH_PAGE'],
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
	const page = await Pages.findOneBy({
		id: ps.pageId,
		userId: user.id,
	});
	if (page == null) throw new ApiError('NO_SUCH_PAGE');

	await Pages.delete(page.id);
});
