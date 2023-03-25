import { DriveFiles, DriveFolders } from '@/models/index.js';
import define from '../../define.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';

export const meta = {
	tags: ['drive'],

	description: "Lists all folders and files in the authenticated user's drive. Folders are always listed first. The limit, if specified, is applied over the total number of elements.",

	requireCredential: true,

	kind: 'read:drive',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			oneOf: [{
				type: 'object',
				optional: false, nullable: false,
				ref: 'DriveFile',
			}, {
				type: 'object',
				optional: false, nullable: false,
				ref: 'DriveFolder',
			}],
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		folderId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const foldersQuery = makePaginationQuery(DriveFolders.createQueryBuilder('folder'), ps.sinceId, ps.untilId)
		.andWhere('folder.userId = :userId', { userId: user.id });
	const filesQuery = makePaginationQuery(DriveFiles.createQueryBuilder('file'), ps.sinceId, ps.untilId)
		.andWhere('file.userId = :userId', { userId: user.id });

	if (ps.folderId) {
		foldersQuery.andWhere('folder.parentId = :parentId', { parentId: ps.folderId });
		filesQuery.andWhere('file.parentId = :parentId', { parentId: ps.folderId });
	} else {
		foldersQuery.andWhere('folder.parentId IS NULL');
		filesQuery.andWhere('file.parentId IS NULL');
	}

	const folders = await foldersQuery.take(ps.limit).getMany();

	const [files, ...packedFolders] = await Promise.all([
		filesQuery.take(ps.limit - folders.length).getMany(),
		...(folders.map(folder => DriveFolders.pack(folder))),
	]);

	const packedFiles = await DriveFiles.packMany(files, { detail: false, self: true });

	return [
		...packedFolders,
		...packedFiles,
	];
});
