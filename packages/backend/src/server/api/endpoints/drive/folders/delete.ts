import { publishDriveStream } from '@/services/stream.js';
import { DriveFolders, DriveFiles } from '@/models/index.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'write:drive',

	errors: ['HAS_CHILD_FILES_OR_FOLDERS', 'NO_SUCH_FOLDER'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		folderId: { type: 'string', format: 'misskey:id' },
	},
	required: ['folderId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	// Get folder
	const folder = await DriveFolders.findOneBy({
		id: ps.folderId,
		userId: user.id,
	});

	if (folder == null) throw new ApiError('NO_SUCH_FOLDER');

	const [childFoldersCount, childFilesCount] = await Promise.all([
		DriveFolders.countBy({ parentId: folder.id }),
		DriveFiles.countBy({ folderId: folder.id }),
	]);

	if (childFoldersCount !== 0 || childFilesCount !== 0) {
		throw new ApiError('HAS_CHILD_FILES_OR_FOLDERS');
	}

	await DriveFolders.delete(folder.id);

	// Publish folderCreated event
	publishDriveStream(user.id, 'folderDeleted', folder.id);
});
