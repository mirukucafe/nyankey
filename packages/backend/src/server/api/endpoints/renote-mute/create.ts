import { genId } from '@/misc/gen-id.js';
import { RenoteMutings } from '@/models/index.js';
import { RenoteMuting } from '@/models/entities/renote-muting.js';
import { publishUserEvent } from '@/services/stream.js';
import define from '@/server/api/define.js';
import { ApiError } from '@/server/api/error.js';
import { getUser } from '@/server/api/common/getters.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'write:mutes',

	errors: ['NO_SUCH_USER', 'MUTEE_IS_YOURSELF', 'ALREADY_MUTING'],
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
	const mutee = await getUser(ps.userId);

	// Check if already muting
	const exist = await RenoteMutings.countBy({
		muterId: muter.id,
		muteeId: mutee.id,
	});

	if (exist) throw new ApiError('ALREADY_MUTING');

	// Create mute
	await RenoteMutings.insert({
		id: genId(),
		createdAt: new Date(),
		muterId: muter.id,
		muteeId: mutee.id,
	} as RenoteMuting);

	publishUserEvent(user.id, 'muteRenote', mutee);
});
