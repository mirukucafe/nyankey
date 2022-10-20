import { publishDriveStream } from '@/services/stream.js';
import { DriveFiles, DriveFolders } from '@/models/index.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'write:drive',

	description: 'Update the properties of a drive file.',

	errors: ['ACCESS_DENIED', 'INVALID_FILE_NAME', 'NO_SUCH_FILE', 'NO_SUCH_FOLDER'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'DriveFile',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		fileId: { type: 'string', format: 'misskey:id' },
		folderId: { type: 'string', format: 'misskey:id', nullable: true },
		name: { type: 'string' },
		isSensitive: { type: 'boolean' },
		comment: { type: 'string', nullable: true, maxLength: 2048 },
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

	if (ps.name) file.name = ps.name;
	if (!DriveFiles.validateFileName(file.name)) {
		throw new ApiError('INVALID_FILE_NAME');
	}

	if (ps.comment !== undefined) file.comment = ps.comment;

	if (ps.isSensitive !== undefined) file.isSensitive = ps.isSensitive;

	if (ps.folderId !== undefined) {
		if (ps.folderId === null) {
			file.folderId = null;
		} else {
			const folder = await DriveFolders.findOneBy({
				id: ps.folderId,
				userId: user.id,
			});

			if (folder == null) throw new ApiError('NO_SUCH_FOLDER');

			file.folderId = folder.id;
		}
	}

	await DriveFiles.update(file.id, {
		name: file.name,
		comment: file.comment,
		folderId: file.folderId,
		isSensitive: file.isSensitive,
	});

	const fileObj = await DriveFiles.pack(file, { self: true });

	// Publish fileUpdated event
	publishDriveStream(user.id, 'fileUpdated', fileObj);

	return fileObj;
});
