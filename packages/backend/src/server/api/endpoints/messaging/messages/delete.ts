import { MessagingMessages } from '@/models/index.js';
import { deleteMessage } from '@/services/messages/delete.js';
import { SECOND, HOUR } from '@/const.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['messaging'],

	requireCredential: true,

	kind: 'write:messaging',

	limit: {
		duration: HOUR,
		max: 300,
		minInterval: SECOND,
	},

	errors: ['NO_SUCH_MESSAGE'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		messageId: { type: 'string', format: 'misskey:id' },
	},
	required: ['messageId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const message = await MessagingMessages.findOneBy({
		id: ps.messageId,
		userId: user.id,
	});

	if (message == null) throw new ApiError('NO_SUCH_MESSAGE');

	await deleteMessage(message);
});
