import { createExportCustomEmojisJob } from '@/queue/index.js';
import { HOUR } from '@/const.js';
import define from '../define.js';

export const meta = {
	secure: true,
	requireCredential: true,
	limit: {
		duration: HOUR,
		max: 1,
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		ids: {
			description: 'Specific emoji IDs to be exported. Non-local emoji will be ignored. If not provided, all local emoji will be exported.',
			type: 'array',
			items: { type: 'string' },
			minItems: 1,
			uniqueItems: true,
		},
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	createExportCustomEmojisJob(user, ps.ids);
});
