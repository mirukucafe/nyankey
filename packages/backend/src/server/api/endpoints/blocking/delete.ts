import deleteBlocking from '@/services/blocking/delete.js';
import { Blockings, Users } from '@/models/index.js';
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

	errors: ['NO_SUCH_USER', 'BLOCKEE_IS_YOURSELF', 'NOT_BLOCKING'],

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
	// Check if the blockee is yourself
	if (user.id === ps.userId) throw new ApiError('BLOCKEE_IS_YOURSELF');

	const blocker = await Users.findOneByOrFail({ id: user.id });

	// Get blockee
	const blockee = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError('NO_SUCH_USER');
		throw e;
	});

	// Check not blocking
	const exist = await Blockings.countBy({
		blockerId: blocker.id,
		blockeeId: blockee.id,
	});

	if (!exist) throw new ApiError('NOT_BLOCKING');

	// Delete blocking
	await deleteBlocking(blocker, blockee);

	return await Users.pack(blockee.id, blocker, {
		detail: true,
	});

	publishUserEvent(user.id, 'unblock', blockee);
});
