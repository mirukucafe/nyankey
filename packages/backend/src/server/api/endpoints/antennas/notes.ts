import { readNote } from '@/services/note/read.js';
import { Antennas, Notes, AntennaNotes } from '@/models/index.js';
import { makePaginationQuery } from '@/server/api/common/make-pagination-query.js';
import { visibilityQuery } from '@/server/api/common/generate-visibility-query.js';
import { generateMutedUserQuery } from '@/server/api/common/generate-muted-user-query.js';
import { generateBlockedUserQuery } from '@/server/api/common/generate-block-query.js';
import define from '@/server/api/define.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['antennas', 'account', 'notes'],

	requireCredential: true,

	kind: 'read:account',

	errors: ['NO_SUCH_ANTENNA'],

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		antennaId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
	},
	required: ['antennaId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const antenna = await Antennas.findOneBy({
		id: ps.antennaId,
		userId: user.id,
	});

	if (antenna == null) throw new ApiError('NO_SUCH_ANTENNA');

	const query = makePaginationQuery(Notes.createQueryBuilder('note'),
		ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
		.innerJoin(AntennaNotes.metadata.targetName, 'antennaNote', 'antennaNote.noteId = note.id')
		.innerJoinAndSelect('note.user', 'user')
		.leftJoinAndSelect('user.avatar', 'avatar')
		.leftJoinAndSelect('user.banner', 'banner')
		.leftJoinAndSelect('note.reply', 'reply')
		.leftJoinAndSelect('note.renote', 'renote')
		.leftJoinAndSelect('reply.user', 'replyUser')
		.leftJoinAndSelect('replyUser.avatar', 'replyUserAvatar')
		.leftJoinAndSelect('replyUser.banner', 'replyUserBanner')
		.leftJoinAndSelect('renote.user', 'renoteUser')
		.leftJoinAndSelect('renoteUser.avatar', 'renoteUserAvatar')
		.leftJoinAndSelect('renoteUser.banner', 'renoteUserBanner')
		.andWhere('antennaNote.antennaId = :antennaId', { antennaId: antenna.id });

	generateMutedUserQuery(query, user);
	generateBlockedUserQuery(query, user);

	const notes = await visibilityQuery(query, user)
		.take(ps.limit)
		.getMany();

	if (notes.length > 0) {
		readNote(user.id, notes);
	}

	return await Notes.packMany(notes, user);
});
