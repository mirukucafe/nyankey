import { DriveFiles, Notes } from '@/models/index.js';
import define from '@/server/api/define.js';
import { ApiError } from '@/server/api/error.js';
import { makePaginationQuery } from '@/server/api/common/make-pagination-query.js';

export const meta = {
	tags: ['drive', 'notes'],

	requireCredential: true,

	kind: 'read:drive',

	description: 'Find the notes to which the given file is attached.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},

	errors: ['NO_SUCH_FILE'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		fileId: { type: 'string', format: 'misskey:id' },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
	},
	required: ['fileId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	// Fetch file
	const file = await DriveFiles.findOneBy({
		id: ps.fileId,
		userId: user.id,
	});

	if (file == null) throw new ApiError('NO_SUCH_FILE');

	const notes = await makePaginationQuery(
			Notes.createQueryBuilder('note'),
			ps.sinceId,
			ps.untilId,
		)
		.andWhere(':file = ANY(note.fileIds)', { file: file.id })
		.take(ps.limit)
		.getMany();

	return await Notes.packMany(notes, user, {
		detail: true,
	});
});
