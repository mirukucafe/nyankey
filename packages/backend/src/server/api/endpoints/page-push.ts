import { publishMainStream } from '@/services/stream.js';
import { Users, Pages } from '@/models/index.js';
import define from '@/server/api/define.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	requireCredential: true,
	secure: true,

	errors: ['NO_SUCH_PAGE'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		pageId: { type: 'string', format: 'misskey:id' },
		event: { type: 'string' },
		var: {},
	},
	required: ['pageId', 'event'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const page = await Pages.findOneBy({ id: ps.pageId });
	if (page == null) throw new ApiError('NO_SUCH_PAGE');

	publishMainStream(page.userId, 'pageEvent', {
		pageId: ps.pageId,
		event: ps.event,
		var: ps.var,
		userId: user.id,
		user: await Users.pack(user.id, { id: page.userId }, {
			detail: true,
		}),
	});
});
