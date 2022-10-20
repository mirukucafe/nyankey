import { DriveFolders } from '@/models/index.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'DriveFolder',
	},

	errors: ['NO_SUCH_FOLDER'],
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

	return await DriveFolders.pack(folder, {
		detail: true,
	});
});
