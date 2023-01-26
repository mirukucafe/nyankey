import { NoteFavorites, NoteThreadMutings, NoteWatchings } from '@/models/index.js';
import { ApiError } from '@/server/api/error.js';
import { getNote } from '../../common/getters.js';
import define from '../../define.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			isFavorited: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			isWatching: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			isMutedThread: {
				type: 'boolean',
				optional: false, nullable: false,
			},
		},
	},

	v2: {
		method: 'get',
		alias: 'notes/:noteId/status',
		pathParameters: ['noteId'],
	},

	errors: ['NO_SUCH_NOTE'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
	},
	required: ['noteId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const note = await getNote(ps.noteId, user).catch(err => {
		if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError('NO_SUCH_NOTE');
		throw err;
	});

	const [favorite, watching, threadMuting] = await Promise.all([
		NoteFavorites.count({
			where: {
				userId: user.id,
				noteId: note.id,
			},
			take: 1,
		}),
		NoteWatchings.count({
			where: {
				userId: user.id,
				noteId: note.id,
			},
			take: 1,
		}),
		NoteThreadMutings.count({
			where: {
				userId: user.id,
				threadId: note.threadId || note.id,
			},
			take: 1,
		}),
	]);

	return {
		isFavorited: favorite !== 0,
		isWatching: watching !== 0,
		isMutedThread: threadMuting !== 0,
	};
});
