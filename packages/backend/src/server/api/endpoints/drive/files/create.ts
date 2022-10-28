import { addFile } from '@/services/drive/add-file.js';
import { DriveFiles } from '@/models/index.js';
import { DB_MAX_IMAGE_COMMENT_LENGTH } from '@/misc/hard-limits.js';
import { HOUR } from '@/const.js';
import define from '../../../define.js';
import { apiLogger } from '../../../logger.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	limit: {
		duration: HOUR,
		max: 120,
	},

	requireFile: true,

	kind: 'write:drive',

	description: 'Upload a new drive file.',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'DriveFile',
	},

	errors: ['INTERNAL_ERROR', 'INVALID_FILE_NAME'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		folderId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
		name: { type: 'string', nullable: true, default: null },
		comment: { type: 'string', nullable: true, maxLength: DB_MAX_IMAGE_COMMENT_LENGTH, default: null },
		isSensitive: { type: 'boolean', default: false },
		force: { type: 'boolean', default: false },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user, _, file, cleanup) => {
	// Get 'name' parameter
	let name = ps.name || file.originalname;
	if (name !== undefined && name !== null) {
		name = name.trim();
		if (name.length === 0) {
			name = null;
		} else if (name === 'blob') {
			name = null;
		} else if (!DriveFiles.validateFileName(name)) {
			throw new ApiError('INVALID_FILE_NAME');
		}
	} else {
		name = null;
	}

	try {
		// Create file
		const driveFile = await addFile({ user, path: file.path, name, comment: ps.comment, folderId: ps.folderId, force: ps.force, sensitive: ps.isSensitive });
		return await DriveFiles.pack(driveFile, { self: true });
	} catch (e) {
		if (e instanceof Error || typeof e === 'string') {
			apiLogger.error(e);
		}
		throw new ApiError('INTERNAL_ERROR');
	} finally {
		cleanup!();
	}
});
