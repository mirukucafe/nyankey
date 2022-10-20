import { createImportBlockingJob } from '@/queue/index.js';
import { DriveFiles } from '@/models/index.js';
import { HOUR } from '@/const.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	secure: true,
	requireCredential: true,

	limit: {
		duration: HOUR,
		max: 1,
	},

	errors: ['EMPTY_FILE', 'FILE_TOO_BIG', 'NO_SUCH_FILE'],
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
	const file = await DriveFiles.findOneBy({ id: ps.fileId });

	if (file == null) throw new ApiError('EMPTY_FILE');
	if (file.size > 50000) throw new ApiError('FILE_TOO_BIG');
	if (file.size === 0) throw new ApiError('EMPTY_FILE');

	createImportBlockingJob(user, file.id);
});
