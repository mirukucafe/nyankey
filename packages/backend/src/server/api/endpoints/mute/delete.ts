import { Mutings } from '@/models/index.js';
import { publishUserEvent } from '@/services/stream.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';
import { getUser } from '../../common/getters.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'write:mutes',

	errors: ['NO_SUCH_USER', 'MUTEE_IS_YOURSELF', 'NOT_MUTING'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const muter = user;

	// Check if the mutee is yourself
	if (user.id === ps.userId) throw new ApiError('MUTEE_IS_YOURSELF');

	// Get mutee
	const mutee = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError('NO_SUCH_USER');
		throw e;
	});

	// Check not muting
	const exist = await Mutings.findOneBy({
		muterId: muter.id,
		muteeId: mutee.id,
	});

	if (exist == null) throw new ApiError('NOT_MUTING');

	// Delete mute
	await Mutings.delete({
		id: exist.id,
	});

	publishUserEvent(user.id, 'unmute', mutee);
});
