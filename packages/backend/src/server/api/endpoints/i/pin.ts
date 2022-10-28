import { addPinned } from '@/services/i/pin.js';
import { Users } from '@/models/index.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['account', 'notes'],

	requireCredential: true,

	kind: 'write:account',

	errors: ['ALREADY_PINNED', 'NO_SUCH_NOTE', 'PIN_LIMIT_EXCEEDED'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'MeDetailed',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
	},
	required: ['noteId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	await addPinned(user, ps.noteId).catch(e => {
		if (e.id === '70c4e51f-5bea-449c-a030-53bee3cce202') throw new ApiError('NO_SUCH_NOTE');
		if (e.id === '15a018eb-58e5-4da1-93be-330fcc5e4e1a') throw new ApiError('PIN_LIMIT_EXCEEDED');
		if (e.id === '23f0cf4e-59a3-4276-a91d-61a5891c1514') throw new ApiError('ALREADY_PINNED');
		throw e;
	});

	return await Users.pack<true, true>(user.id, user, {
		detail: true,
	});
});
