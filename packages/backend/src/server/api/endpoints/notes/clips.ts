import { In } from 'typeorm';
import { ClipNotes, Clips } from '@/models/index.js';
import define from '@/server/api/define.js';
import { getNote } from '@/server/api/common/getters.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['clips', 'notes'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Clip',
		},
	},

	v2: {
		method: 'get',
		alias: 'notes/:noteId/clips',
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
export default define(meta, paramDef, async (ps, me) => {
	const note = await getNote(ps.noteId, me).catch(err => {
		if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError('NO_SUCH_NOTE');
		throw err;
	});

	const clipNotes = await ClipNotes.findBy({
		noteId: note.id,
	});

	const clips = await Clips.findBy({
		id: In(clipNotes.map(x => x.clipId)),
		isPublic: true,
	});

	return await Promise.all(clips.map(x => Clips.pack(x)));
});
