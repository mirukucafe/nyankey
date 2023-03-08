import { Webhooks } from '@/models/index.js';
import define from '@/server/api/define.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['webhooks'],

	requireCredential: true,

	kind: 'read:account',

	errors: ['NO_SUCH_WEBHOOK'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		webhookId: { type: 'string', format: 'misskey:id' },
	},
	required: ['webhookId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const webhook = await Webhooks.findOneBy({
		id: ps.webhookId,
		userId: user.id,
	});

	if (webhook == null) throw new ApiError('NO_SUCH_WEBHOOK');

	return webhook;
});
