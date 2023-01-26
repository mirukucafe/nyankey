import { Notes } from '@/models/index.js';
import define from '../../define.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';
import { generateVisibilityQuery } from '../../common/generate-visibility-query.js';
import { generateMutedUserQuery } from '../../common/generate-muted-user-query.js';
import { generateBlockedUserQuery } from '../../common/generate-block-query.js';

export const meta = {
	tags: ['notes'],

	requireCredential: false,

	description: 'Get a list of children of a notes. Children includes replies as well as quote renotes that quote the respective post. A post will not be duplicated if it is a reply and a quote of a note in this thread. For depths larger than 1 the threading has to be computed by the client.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},

	v2: {
		method: 'get',
		alias: 'notes/:noteId/children',
		pathParameters: ['noteId'],
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		limit: {
			description: 'The maximum number of replies/quotes to show per parent note, i.e. the maximum number of children each note may have.',
			type: 'integer',
			minimum: 1,
			maximum: 100,
			default: 10,
		},
		depth: {
			description: 'The number of layers of replies to fetch at once. Defaults to 1 for backward compatibility.',
			type: 'integer',
			minimum: 1,
			maximum: 100,
			default: 1,
		},
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: ['noteId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const query = makePaginationQuery(Notes.createQueryBuilder('note'), ps.sinceId, ps.untilId)
		.andWhere('note.id IN (SELECT id FROM note_replies(:noteId, :depth, :limit))', { noteId: ps.noteId, depth: ps.depth, limit: ps.limit })
		.innerJoinAndSelect('note.user', 'user');

	generateVisibilityQuery(query, user);
	if (user) {
		generateMutedUserQuery(query, user);
		generateBlockedUserQuery(query, user);
	}

	const notes = await query.getMany();

	return await Notes.packMany(notes, user, { detail: false });
});
