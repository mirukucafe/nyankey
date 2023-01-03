import create from '@/services/blocking/create.js';
import { Blockings, NoteWatchings, Users } from '@/models/index.js';
import { HOUR } from '@/const.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';
import { getUser } from '../../common/getters.js';

export const meta = {
	tags: ['account'],

	limit: {
		duration: HOUR,
		max: 100,
	},

	requireCredential: true,

	kind: 'write:blocks',

	errors: ['NO_SUCH_USER', 'BLOCKEE_IS_YOURSELF', 'ALREADY_BLOCKING'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserDetailedNotMe',
	},
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
	const blocker = await Users.findOneByOrFail({ id: user.id });

	// 自分自身
	if (user.id === ps.userId) throw new ApiError('BLOCKEE_IS_YOURSELF');

	// Get blockee
	const blockee = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError('NO_SUCH_USER');
		throw e;
	});

	// Check if already blocking
	const blocked = await Blockings.countBy({
		blockerId: blocker.id,
		blockeeId: blockee.id,
	});

	if (blocked) throw new ApiError('ALREADY_BLOCKING');

	await create(blocker, blockee);

	NoteWatchings.delete({
		userId: blocker.id,
		noteUserId: blockee.id,
	});

	return await Users.pack(blockee.id, blocker, {
		detail: true,
	});

	publishUserEvent(user.id, 'block', blockee);
});
