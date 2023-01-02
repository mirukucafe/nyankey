import { ArrayOverlap, Not } from 'typeorm';
import { publishNoteStream } from '@/services/stream.js';
import { CacheableUser } from '@/models/entities/user.js';
import { Note } from '@/models/entities/note.js';
import { PollVotes, NoteWatchings, Polls, Blockings, NoteThreadMutings } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { createNotification } from '@/services/create-notification.js';

export async function vote(user: CacheableUser, note: Note, choice: number): Promise<void> {
	const poll = await Polls.findOneBy({ noteId: note.id });

	if (poll == null) throw new Error('poll not found');

	// Check whether is valid choice
	if (poll.choices[choice] == null) throw new Error('invalid choice param');

	// Check blocking
	if (note.userId !== user.id) {
		const block = await Blockings.countBy({
			blockerId: note.userId,
			blockeeId: user.id,
		});
		if (block) {
			throw new Error('blocked');
		}
	}

	// if already voted
	const exist = await PollVotes.findBy({
		noteId: note.id,
		userId: user.id,
	});

	if (poll.multiple) {
		if (exist.some(x => x.choice === choice)) {
			throw new Error('already voted');
		}
	} else if (exist.length !== 0) {
		throw new Error('already voted');
	}

	// Create vote
	await PollVotes.insert({
		id: genId(),
		createdAt: new Date(),
		noteId: note.id,
		userId: user.id,
		choice,
	});

	// Increment votes count
	const index = choice + 1; // In SQL, array index is 1 based
	await Polls.query(`UPDATE poll SET votes[${index}] = votes[${index}] + 1 WHERE "noteId" = '${poll.noteId}'`);

	publishNoteStream(note.id, 'pollVoted', {
		choice,
		userId: user.id,
	});

	// check if this thread and notification type is muted
	const muted = await NoteThreadMutings.countBy({
		userId: note.userId,
		threadId: note.threadId || note.id,
		mutingNotificationTypes: ArrayOverlap(['pollVote']),
	});
	// Notify
	if (!muted) {
		createNotification(note.userId, 'pollVote', {
			notifierId: user.id,
			noteId: note.id,
			choice,
		});
	}

	// Fetch watchers
	NoteWatchings.findBy({
		noteId: note.id,
		userId: Not(user.id),
	})
	.then(watchers => {
		for (const watcher of watchers) {
			createNotification(watcher.userId, 'pollVote', {
				notifierId: user.id,
				noteId: note.id,
				choice,
			});
		}
	});
}
