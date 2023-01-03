import { Announcements } from '@/models/index.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	errors: ['NO_SUCH_ANNOUNCEMENT'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'misskey:id' },
	},
	required: ['id'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	const announcement = await Announcements.findOneBy({ id: ps.id });

	if (announcement == null) throw new ApiError('NO_SUCH_ANNOUNCEMENT');

	await Announcements.delete(announcement.id);
});
