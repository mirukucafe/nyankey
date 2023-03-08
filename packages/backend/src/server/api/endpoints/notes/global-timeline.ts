import { fetchMeta } from '@/misc/fetch-meta.js';
import { Notes } from '@/models/index.js';
import { activeUsersChart } from '@/services/chart/index.js';
import define from '@/server/api/define.js';
import { ApiError } from '@/server/api/error.js';
import { makePaginationQuery } from '@/server/api/common/make-pagination-query.js';
import { generateMutedUserQuery } from '@/server/api/common/generate-muted-user-query.js';
import { generateRepliesQuery } from '@/server/api/common/generate-replies-query.js';
import { generateMutedNoteQuery } from '@/server/api/common/generate-muted-note-query.js';
import { generateBlockedUserQuery } from '@/server/api/common/generate-block-query.js';
import { generateMutedRenotesQuery } from '@/server/api/common/generated-muted-renote-query.js';

export const meta = {
	tags: ['notes'],

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},

	errors: ['TIMELINE_DISABLED'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		withFiles: {
			type: 'boolean',
			default: false,
			description: 'Only show notes that have attached files.',
		},
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const m = await fetchMeta();
	if (m.disableGlobalTimeline) {
		if (user == null || (!user.isAdmin && !user.isModerator)) {
			throw new ApiError('TIMELINE_DISABLED');
		}
	}

	//#region Construct query
	const query = makePaginationQuery(Notes.createQueryBuilder('note'),
		ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
		.andWhere('note.visibility = \'public\'')
		.andWhere('note.channelId IS NULL')
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
		.leftJoinAndSelect('renoteUser.banner', 'renoteUserBanner');

	generateRepliesQuery(query, user);
	if (user) {
		generateMutedUserQuery(query, user);
		generateMutedNoteQuery(query, user);
		generateBlockedUserQuery(query, user);
		generateMutedRenotesQuery(query, user);
	}

	if (ps.withFiles) {
		query.andWhere('note.fileIds != \'{}\'');
	}
	//#endregion

	const timeline = await query.take(ps.limit).getMany();

	process.nextTick(() => {
		if (user) {
			activeUsersChart.read(user);
		}
	});

	return await Notes.packMany(timeline, user);
});
