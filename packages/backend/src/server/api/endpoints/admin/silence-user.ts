import { Users } from '@/models/index.js';
import { ApiError } from '@/server/api/error.js';
import { insertModerationLog } from '@/services/insert-moderation-log.js';
import { publishInternalEvent } from '@/services/stream.js';
import define from '../../define.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	errors: ['NO_SUCH_USER', 'IS_ADMIN'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const user = await Users.findOneBy({ id: ps.userId });

	if (user == null) {
		throw new ApiError('NO_SUCH_USER');
	}

	if (user.isAdmin) {
		throw new ApiError('IS_ADMIN');
	}

	await Users.update(user.id, {
		isSilenced: true,
	});

	publishInternalEvent('userChangeSilencedState', { id: user.id, isSilenced: true });

	insertModerationLog(me, 'silence', {
		targetId: user.id,
	});
});
