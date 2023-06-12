import { In } from 'typeorm';
import { DriveFiles, DriveFolders } from '@/models/index.js';
import define from '../../define.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';
import { db } from '@/db/postgre.js';

export const meta = {
	tags: ['drive'],

	description: "Lists all folders and files in the authenticated user's drive. Default sorting is folders first, then newest first. The limit, if specified, is applied over the total number of elements.",

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
		limit: {
			type: 'integer',
			minimum: 1,
			maximum: 100,
			default: 30
		},
		offset: {
			type: 'integer',
			default: 0,
		},
		sort: {
			type: 'string',
			enum: [
				'+createdAt',
				'-createdAt',
				'+name',
				'-name',
			],
		},
		folderId: {
			type: 'string',
			format: 'misskey:id',
			nullable: true,
			default: null
		},
		name: {
			description: 'Filters the output for files and folders that contain the given string (case insensitive).',
			type: 'string',
			default: '',
		},
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	let orderBy = 'type ASC, id DESC';
	switch (ps.sort) {
		case '+createdAt':
			orderBy = '"createdAt" DESC';
			break;
		case '-createdAt':
			orderBy = '"createdAt" ASC';
			break;
		case '+name':
			orderBy = 'name DESC';
			break;
		case '-name':
			orderBy = 'name ASC';
			break;
	}

	// due to the way AID is constructed, we can be sure that the IDs are not duplicated across tables.
	const ids = await db.query(
		'SELECT id FROM (SELECT id, "userId", "parentId", "createdAt", name, 0 AS type FROM drive_folder'
		+ ' UNION SELECT id, "userId", "parentId", "createdAt", name, 1 AS type FROM drive_file) AS x'
		+ ' WHERE "userId" = $1 AND name ILIKE $2 AND "parentId"'
		+ (ps.folderId ? '= $5' : 'IS NULL')
		+ ' ORDER BY ' + orderBy
		+ ' LIMIT $3 OFFSET $4',
		[user.id, '%' + ps.name + '%', ps.limit, ps.offset, ...(ps.folderId ? [ps.folderId] : [])]
	).then(items => items.map(({ id }) => id));

	const [folders, files] = await Promise.all([
		DriveFolders.findBy({
			id: In(ids),
		})
		.then(folders => Promise.all(folders.map(folder => DriveFolders.pack(folder)))),
		DriveFiles.findBy({
			id: In(ids),
		})
		.then(files => DriveFiles.packMany(files, { detail: false, self: true })),
	]);

	// merge folders/files into one array, keeping the original sorting
	let merged = [];
	for (const folder of folders) {
		merged[ids.indexOf(folder.id)] = folder;
	}
	for (const file of files) {
		merged[ids.indexOf(file.id)] = file;
	}

	return merged;
});
