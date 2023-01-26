import { FindOptionsWhere } from 'typeorm';
import { NoteReactions } from '@/models/index.js';
import { NoteReaction } from '@/models/entities/note-reaction.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';
import { getNote } from '../../common/getters.js';

export const meta = {
	tags: ['notes', 'reactions'],

	requireCredential: false,

	allowGet: true,
	cacheSec: 60,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'NoteReaction',
		},
	},

	v2: {
		method: 'get',
		alias: 'notes/:noteId/reactions',
		pathParameters: ['noteId'],
	},

	errors: ['NO_SUCH_NOTE'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		type: {
			description: 'A Unicode emoji or custom emoji code. A custom emoji should look like `:name:` or `:name@example.com:`.',
			type: 'string',
			nullable: true,
		},
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: ['noteId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	// check note visibility
	await getNote(ps.noteId, user).catch(err => {
		if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError('NO_SUCH_NOTE');
		throw err;
	});

	const query = {
		noteId: ps.noteId,
	} as FindOptionsWhere<NoteReaction>;

	if (ps.type) {
		// ローカルリアクションはホスト名が . とされているが
		// DB 上ではそうではないので、必要に応じて変換
		const suffix = '@.:';
		const type = ps.type.endsWith(suffix) ? ps.type.slice(0, ps.type.length - suffix.length) + ':' : ps.type;
		query.reaction = type;
	}

	const reactions = await NoteReactions.find({
		where: query,
		take: ps.limit,
		skip: ps.offset,
		order: {
			id: -1,
		},
		relations: ['user', 'user.avatar', 'user.banner', 'note'],
	});

	return await NoteReactions.packMany(reactions, user);
});
