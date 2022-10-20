import { deleteFile } from '@/services/drive/delete-file.js';
import { publishDriveStream } from '@/services/stream.js';
import { DriveFiles } from '@/models/index.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'write:drive',

	description: 'Delete an existing drive file.',

	errors: ['ACCESS_DENIED', 'NO_SUCH_FILE'],
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

	if (file == null) throw new ApiError('NO_SUCH_FILE');

	if ((!user.isAdmin && !user.isModerator) && (file.userId !== user.id)) {
		throw new ApiError('ACCESS_DENIED');
	}

	// Delete
	await deleteFile(file);

	// Publish fileDeleted event
	publishDriveStream(user.id, 'fileDeleted', file.id);
});
