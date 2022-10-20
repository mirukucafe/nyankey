import { publishDriveStream } from '@/services/stream.js';
import { DriveFolders } from '@/models/index.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'write:drive',

	errors: ['NO_SUCH_FOLDER', 'NO_SUCH_PARENT_FOLDER', 'RECURSIVE_FOLDER'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'DriveFolder',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		folderId: { type: 'string', format: 'misskey:id' },
		name: { type: 'string', maxLength: 200 },
		parentId: { type: 'string', format: 'misskey:id', nullable: true },
	},
	required: ['folderId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	// Fetch folder
	const folder = await DriveFolders.findOneBy({
		id: ps.folderId,
		userId: user.id,
	});

	if (folder == null) throw new ApiError('NO_SUCH_FOLDER');

	if (ps.name) folder.name = ps.name;

	if (ps.parentId !== undefined) {
		if (ps.parentId === folder.id) {
			throw new ApiError('RECURSIVE_FOLDER');
		} else if (ps.parentId === null) {
			folder.parentId = null;
		} else {
			// Get parent folder
			const parent = await DriveFolders.findOneBy({
				id: ps.parentId,
				userId: user.id,
			});

			if (parent == null) throw new ApiError('NO_SUCH_PARENT_FOLDER');

			// Check if the circular reference will occur
			async function checkCircle(folderId: string): Promise<boolean> {
				// Fetch folder
				const folder2 = await DriveFolders.findOneBy({
					id: folderId,
				});

				if (folder2!.id === folder!.id) {
					return true;
				} else if (folder2!.parentId) {
					return await checkCircle(folder2!.parentId);
				} else {
					return false;
				}
			}

			if (parent.parentId !== null) {
				if (await checkCircle(parent.parentId)) {
					throw new ApiError('RECURSIVE_FOLDER');
				}
			}

			folder.parentId = parent.id;
		}
	}

	// Update
	DriveFolders.update(folder.id, {
		name: folder.name,
		parentId: folder.parentId,
	});

	const folderObj = await DriveFolders.pack(folder);

	// Publish folderUpdated event
	publishDriveStream(user.id, 'folderUpdated', folderObj);

	return folderObj;
});
