import { createImportCustomEmojisJob } from '@/queue/index.js';
import define from '@/server/api/define.js';

export const meta = {
	secure: true,
	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		fileId: { type: 'string', format: 'misskey:id' },
	},
	required: ['fileId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	createImportCustomEmojisJob(user, ps.fileId);
});
