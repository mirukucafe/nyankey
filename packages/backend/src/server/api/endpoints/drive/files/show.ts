import { DriveFile } from '@/models/entities/drive-file.js';
import { DriveFiles } from '@/models/index.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

	description: 'Show the properties of a drive file.',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'DriveFile',
	},

	errors: ['ACCESS_DENIED', 'NO_SUCH_FILE'],
} as const;

export const paramDef = {
	type: 'object',
	anyOf: [
		{
			properties: {
				fileId: { type: 'string', format: 'misskey:id' },
			},
			required: ['fileId'],
		},
		{
			properties: {
				url: { type: 'string' },
			},
			required: ['url'],
		},
	],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	let file: DriveFile | null = null;

	if (ps.fileId) {
		file = await DriveFiles.findOneBy({ id: ps.fileId });
	} else if (ps.url) {
		file = await DriveFiles.findOne({
			where: [{
				url: ps.url,
			}, {
				webpublicUrl: ps.url,
			}, {
				thumbnailUrl: ps.url,
			}],
		});
	}

	if (file == null) throw new ApiError('NO_SUCH_FILE');

	if ((!user.isAdmin && !user.isModerator) && (file.userId !== user.id)) {
		throw new ApiError('ACCESS_DENIED');
	}

	return await DriveFiles.pack(file, {
		detail: true,
		withUser: true,
		self: true,
	});
});
