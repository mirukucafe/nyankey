import { deleteFile } from '@/services/drive/delete-file.js';
import { DriveFiles } from '@/models/index.js';
import define from '@/server/api/define.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	const files = await DriveFiles.findBy({
		userId: ps.userId,
	});

	for (const file of files) {
		deleteFile(file);
	}
});
