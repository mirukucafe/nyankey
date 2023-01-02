import { ArrayOverlap, Not } from 'typeorm';
import { publishNoteStream } from '@/services/stream.js';
import { createNotification } from '@/services/create-notification.js';
import { deliver } from '@/queue/index.js';
import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import renderVote from '@/remote/activitypub/renderer/vote.js';
import { deliverQuestionUpdate } from '@/services/note/polls/update.js';
import { PollVotes, NoteWatchings, Users, Polls, Blockings, NoteThreadMutings } from '@/models/index.js';
import { IRemoteUser } from '@/models/entities/user.js';
import { genId } from '@/misc/gen-id.js';
import { getNote } from '../../../common/getters.js';
import { ApiError } from '../../../error.js';
import define from '../../../define.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	kind: 'write:votes',

	errors: ['NO_SUCH_NOTE', 'INVALID_CHOICE', 'ALREADY_VOTED', 'EXPIRED_POLL', 'BLOCKED'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		choice: { type: 'integer', minimum: 0 },
	},
	required: ['noteId', 'choice'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const createdAt = new Date();

	// Get votee
	const note = await getNote(ps.noteId, user).catch(err => {
		if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError('NO_SUCH_NOTE');
		throw err;
	});

	if (!note.hasPoll) {
		throw new ApiError('NO_SUCH_NOTE', 'The note exists but does not have a poll attached.');
	}

	// Check blocking
	if (note.userId !== user.id) {
		const blocked = await Blockings.countBy({
			blockerId: note.userId,
			blockeeId: user.id,
		});
		if (blocked) throw new ApiError('BLOCKED');
	}

	const poll = await Polls.findOneByOrFail({ noteId: note.id });

	if (poll.expiresAt && poll.expiresAt < createdAt) {
		throw new ApiError('EXPIRED_POLL');
	}

	if (poll.choices[ps.choice] == null) {
		throw new ApiError('INVALID_CHOICE', `There are only ${poll.choices.length} choices.`);
	}

	// if already voted
	const exist = await PollVotes.findBy({
		noteId: note.id,
		userId: user.id,
	});

	if (exist.length) {
		if (poll.multiple) {
			if (exist.some(x => x.choice === ps.choice)) {
				throw new ApiError('ALREADY_VOTED', 'This is a multiple choice poll, but you already voted for that option.');
			}
		} else {
			throw new ApiError('ALREADY_VOTED', 'This is a single choice poll.');
		}
	}

	// Create vote
	const vote = await PollVotes.insert({
		id: genId(),
		createdAt,
		noteId: note.id,
		userId: user.id,
		choice: ps.choice,
	}).then(x => PollVotes.findOneByOrFail(x.identifiers[0]));

	// Increment votes count
	const index = ps.choice + 1; // In SQL, array index is 1 based
	await Polls.query(`UPDATE poll SET votes[${index}] = votes[${index}] + 1 WHERE "noteId" = '${poll.noteId}'`);

	publishNoteStream(note.id, 'pollVoted', {
		choice: ps.choice,
		userId: user.id,
	});

	// check if this thread and notification type is muted
	const threadMuted = await NoteThreadMutings.countBy({
		userId: note.userId,
		threadId: note.threadId || note.id,
		mutingNotificationTypes: ArrayOverlap(['pollVote']),
	});
	// Notify
	if (!threadMuted) {
		createNotification(note.userId, 'pollVote', {
			notifierId: user.id,
			noteId: note.id,
			choice: ps.choice,
		});
	}

	// Fetch watchers
	// checking for mutes is not necessary here, as note watchings will be
	// deleted when a thread is muted
	NoteWatchings.findBy({
		noteId: note.id,
		userId: Not(user.id),
	}).then(watchers => {
		for (const watcher of watchers) {
			createNotification(watcher.userId, 'pollVote', {
				notifierId: user.id,
				noteId: note.id,
				choice: ps.choice,
			});
		}
	});

	// リモート投票の場合リプライ送信
	if (note.userHost != null) {
		const pollOwner = await Users.findOneByOrFail({ id: note.userId }) as IRemoteUser;

		deliver(user, renderActivity(await renderVote(user, vote, note, poll, pollOwner)), pollOwner.inbox);
	}

	// リモートフォロワーにUpdate配信
	deliverQuestionUpdate(note.id);
});
