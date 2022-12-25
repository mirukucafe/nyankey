import { DriveFiles, GalleryPosts } from '@/models/index.js';
import { DriveFile } from '@/models/entities/drive-file.js';
import { HOUR } from '@/const.js';
import { ApiError } from '@/server/api/error.js';
import define from '../../../define.js';

export const meta = {
	tags: ['gallery'],

	requireCredential: true,

	kind: 'write:gallery',

	limit: {
		duration: HOUR,
		max: 300,
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'GalleryPost',
	},

	errors: ['INVALID_PARAM'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		postId: { type: 'string', format: 'misskey:id' },
		title: { type: 'string', minLength: 1 },
		description: { type: 'string', nullable: true },
		fileIds: { type: 'array', uniqueItems: true, minItems: 1, maxItems: 32, items: {
			type: 'string', format: 'misskey:id',
		} },
		isSensitive: { type: 'boolean', default: false },
	},
	required: ['postId', 'title', 'fileIds'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const files = (await Promise.all(ps.fileIds.map(fileId =>
		DriveFiles.findOneBy({
			id: fileId,
			userId: user.id,
		}),
	))).filter((file): file is DriveFile => file != null);

	if (files.length !== ps.fileIds.length) {
		throw new ApiError(
			'INVALID_PARAM',
			{
				param: '#/properties/fileIds/items',
				reason: 'contains invalid file IDs',
			}
		);
	}

	await GalleryPosts.update({
		id: ps.postId,
		userId: user.id,
	}, {
		updatedAt: new Date(),
		title: ps.title,
		description: ps.description,
		isSensitive: ps.isSensitive,
		fileIds: files.map(file => file.id),
	});

	const post = await GalleryPosts.findOneByOrFail({ id: ps.postId });

	return await GalleryPosts.pack(post, user);
});
