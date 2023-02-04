import { In } from 'typeorm';
import { noteVisibilities, entities } from 'foundkey-js';
import create from '@/services/note/create.js';
import { User } from '@/models/entities/user.js';
import { Users, DriveFiles, Notes, Channels, Blockings } from '@/models/index.js';
import { DriveFile } from '@/models/entities/drive-file.js';
import { Note } from '@/models/entities/note.js';
import { Channel } from '@/models/entities/channel.js';
import { HOUR } from '@/const.js';
import config from '@/config/index.js';
import { ApiError } from '../../error.js';
import define from '../../define.js';
import { getNote } from '../../common/getters.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	limit: {
		duration: HOUR,
		max: 300,
	},

	kind: 'write:notes',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			createdNote: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'Note',
			},
		},
	},

	v2: {
		method: 'post',
		alias: 'notes',
	},

	errors: ['NO_SUCH_NOTE', 'PURE_RENOTE', 'EXPIRED_POLL', 'NO_SUCH_CHANNEL', 'BLOCKED', 'LESS_RESTRICTIVE_VISIBILITY'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		visibility: {
			description: 'The visibility of the new note. Must be the same or more restrictive than a replied to or quoted note.',
			type: 'string',
			enum: noteVisibilities,
			default: 'public',
		},
		visibleUserIds: { type: 'array', uniqueItems: true, items: {
			type: 'string', format: 'misskey:id',
		} },
		text: { type: 'string', maxLength: config.maxNoteTextLength, nullable: true },
		cw: { type: 'string', nullable: true, maxLength: 100 },
		localOnly: { type: 'boolean', default: false },
		noExtractMentions: { type: 'boolean', default: false },
		noExtractHashtags: { type: 'boolean', default: false },
		noExtractEmojis: { type: 'boolean', default: false },
		fileIds: {
			type: 'array',
			uniqueItems: true,
			minItems: 1,
			maxItems: 16,
			items: { type: 'string', format: 'misskey:id' },
		},
		mediaIds: {
			deprecated: true,
			description: 'Use `fileIds` instead. If both are specified, this property is discarded.',
			type: 'array',
			uniqueItems: true,
			minItems: 1,
			maxItems: 16,
			items: { type: 'string', format: 'misskey:id' },
		},
		replyId: { type: 'string', format: 'misskey:id', nullable: true },
		renoteId: { type: 'string', format: 'misskey:id', nullable: true },
		channelId: { type: 'string', format: 'misskey:id', nullable: true },
		poll: {
			type: 'object',
			nullable: true,
			properties: {
				choices: {
					type: 'array',
					uniqueItems: true,
					minItems: 2,
					maxItems: 10,
					items: { type: 'string', minLength: 1, maxLength: 50 },
				},
				multiple: { type: 'boolean', default: false },
				expiresAt: { type: 'integer', nullable: true },
				expiredAfter: { type: 'integer', nullable: true, minimum: 1 },
			},
			required: ['choices'],
		},
	},
	anyOf: [
		{
			// (re)note with text, files and poll are optional
			properties: {
				text: { type: 'string', minLength: 1, maxLength: config.maxNoteTextLength, nullable: false },
			},
			required: ['text'],
		},
		{
			// (re)note with files, text and poll are optional
			required: ['fileIds'],
		},
		{
			// (re)note with files, text and poll are optional
			required: ['mediaIds'],
		},
		{
			// (re)note with poll, text and files are optional
			properties: {
				poll: { type: 'object', nullable: false },
			},
			required: ['poll'],
		},
		{
			// pure renote
			required: ['renoteId'],
		},
	],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	let visibleUsers: User[] = [];
	if (ps.visibleUserIds) {
		visibleUsers = await Users.findBy({
			id: In(ps.visibleUserIds),
		});
	}

	let files: DriveFile[] = [];
	const fileIds = ps.fileIds != null ? ps.fileIds : ps.mediaIds != null ? ps.mediaIds : null;
	if (fileIds != null) {
		files = await DriveFiles.createQueryBuilder('file')
			.where('file.userId = :userId AND file.id IN (:...fileIds)', {
				userId: user.id,
				fileIds,
			})
			.orderBy('array_position(ARRAY[:...fileIds], "id"::text)')
			.setParameters({ fileIds })
			.getMany();
	}

	let renote: Note | null = null;
	if (ps.renoteId != null) {
		// Fetch renote to note
		renote = await getNote(ps.renoteId, user).catch(e => {
			if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError('NO_SUCH_NOTE', 'Note to be renoted not found.');
			throw e;
		});

		if (entities.isPureRenote(renote)) throw new ApiError('PURE_RENOTE', 'Cannot renote a pure renote.');

		// check that the visibility is not less restrictive
		if (noteVisibilities.indexOf(renote.visibility) > noteVisibilities.indexOf(ps.visibility)) {
			throw new ApiError('LESS_RESTRICTIVE_VISIBILITY', `The renote has visibility ${renote.visibility}.`);
		}

		// Check blocking
		if (renote.userId !== user.id) {
			const blocked = await Blockings.countBy({
				blockerId: renote.userId,
				blockeeId: user.id,
			});
			if (blocked) throw new ApiError('BLOCKED', 'Blocked by author of note to be renoted.');
		}
	}

	let reply: Note | null = null;
	if (ps.replyId != null) {
		// Fetch reply
		reply = await getNote(ps.replyId, user).catch(e => {
			if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError('NO_SUCH_NOTE', 'Replied to note not found.');
			throw e;
		});

		if (entities.isPureRenote(reply)) throw new ApiError('PURE_RENOTE', 'Cannot reply to a pure renote.');

		// check that the visibility is not less restrictive
		if (noteVisibilities.indexOf(reply.visibility) > noteVisibilities.indexOf(ps.visibility)) {
			throw new ApiError('LESS_RESTRICTIVE_VISIBILITY', `The replied to note has visibility ${reply.visibility}.`);
		}

		// Check blocking
		if (reply.userId !== user.id) {
			const blocked = await Blockings.countBy({
				blockerId: reply.userId,
				blockeeId: user.id,
			});
			if (blocked) throw new ApiError('BLOCKED', 'Blocked by author of replied to note.');
		}
	}

	if (ps.poll) {
		if (typeof ps.poll.expiresAt === 'number') {
			if (ps.poll.expiresAt < Date.now()) {
				throw new ApiError('EXPIRED_POLL');
			}
		} else if (typeof ps.poll.expiredAfter === 'number') {
			ps.poll.expiresAt = Date.now() + ps.poll.expiredAfter;
		}
	}

	let channel: Channel | null = null;
	if (ps.channelId != null) {
		channel = await Channels.findOneBy({ id: ps.channelId });

		if (channel == null) throw new ApiError('NO_SUCH_CHANNEL');
	}

	// 投稿を作成
	const note = await create(user, {
		createdAt: new Date(),
		files,
		poll: ps.poll ? {
			choices: ps.poll.choices,
			multiple: ps.poll.multiple || false,
			expiresAt: ps.poll.expiresAt ? new Date(ps.poll.expiresAt) : null,
		} : undefined,
		text: ps.text || undefined,
		reply,
		renote,
		cw: ps.cw,
		localOnly: ps.localOnly,
		visibility: ps.visibility,
		visibleUsers,
		channel,
		apMentions: ps.noExtractMentions ? [] : undefined,
		apHashtags: ps.noExtractHashtags ? [] : undefined,
		apEmojis: ps.noExtractEmojis ? [] : undefined,
	});

	return {
		createdNote: await Notes.pack(note, user),
	};
});
