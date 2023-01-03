import { genId } from '@/misc/gen-id.js';
import { Mutings, NoteWatchings } from '@/models/index.js';
import { Muting } from '@/models/entities/muting.js';
import { publishUserEvent } from '@/services/stream.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';
import { getUser } from '../../common/getters.js';

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
		expiresAt: {
			type: 'integer',
			nullable: true,
			description: 'A Unix Epoch timestamp that must lie in the future. `null` means an indefinite mute.',
		},
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const muter = user;

	// 自分自身
	if (user.id === ps.userId) throw new ApiError('MUTEE_IS_YOURSELF');

	// Get mutee
	const mutee = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError('NO_SUCH_USER');
		throw e;
	});

	// Check if already muting
	const exist = await Mutings.countBy({
		muterId: muter.id,
		muteeId: mutee.id,
	});

	if (exist) throw new ApiError('ALREADY_MUTING');

	if (ps.expiresAt && ps.expiresAt <= Date.now()) {
		return;
	}

	// Create mute
	await Mutings.insert({
		id: genId(),
		createdAt: new Date(),
		expiresAt: ps.expiresAt ? new Date(ps.expiresAt) : null,
		muterId: muter.id,
		muteeId: mutee.id,
	} as Muting);

	publishUserEvent(user.id, 'mute', mutee);

	NoteWatchings.delete({
		userId: muter.id,
		noteUserId: mutee.id,
	});
});
