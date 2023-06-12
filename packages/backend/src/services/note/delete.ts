import { FindOptionsWhere, In, IsNull, Not } from 'typeorm';
import * as foundkey from 'foundkey-js';
import { publishNoteStream } from '@/services/stream.js';
import renderDelete from '@/remote/activitypub/renderer/delete.js';
import renderAnnounce from '@/remote/activitypub/renderer/announce.js';
import renderUndo from '@/remote/activitypub/renderer/undo.js';
import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import renderTombstone from '@/remote/activitypub/renderer/tombstone.js';
import config from '@/config/index.js';
import { User, ILocalUser, IRemoteUser } from '@/models/entities/user.js';
import { Note } from '@/models/entities/note.js';
import { Notes, Users, Instances } from '@/models/index.js';
import { notesChart, perUserNotesChart, instanceChart } from '@/services/chart/index.js';
import { DeliverManager } from '@/remote/activitypub/deliver-manager.js';
import { countSameRenotes } from '@/misc/count-same-renotes.js';
import { registerOrFetchInstanceDoc } from '../register-or-fetch-instance-doc.js';
import { deliverMultipleToRelays } from '../relay.js';

/**
 * Delete several notes of the same user.
 * @param notes Array of notes to be deleted.
 * @param user Author of the notes. Will be fetched if not provided.
 */
export async function deleteNotes(notes: Note[], user?: User): Promise<void> {
	if (notes.length === 0) return;

	const fetchedUser = user ?? await Users.findOneByOrFail({ id: notes[0].userId });

	const cascadingNotes = await Promise.all(
		notes.map(note => findCascadingNotes(note))
	).then(res => res.flat());

	// perform side effects for notes and cascaded notes
	await Promise.all(
		notes.concat(cascadingNotes)
			.map(note => deletionSideEffects(note, fetchedUser))
	);

	// Compute delivery content for later.
	// It is important that this is done before deleting notes from
	// the database since we may need some information from parent
	// notes that cause this one to be cascade-deleted.
	let content = await Promise.all(
		notes.concat(cascadingNotes)
			// only deliver for local notes that are not local-only
			.filter(note => note.userHost == null && !note.localOnly)
			.map(async note => {
				let renote: Note | null = null;

				// if the deleted note is a renote
				if (foundkey.entities.isPureRenote(note)) {
					renote = await Notes.findOneBy({ id: note.renoteId });
				}

				return renderActivity(renote
					? renderUndo(renderAnnounce(renote.uri || `${config.url}/notes/${renote.id}`, note), fetchedUser)
					: renderDelete(renderTombstone(`${config.url}/notes/${note.id}`), fetchedUser));
			})
	);

	// Compute addressing information.
	// Since we do not send any actual content, we send all note deletions to everyone.
	const manager = new DeliverManager(fetchedUser, content);
	manager.addFollowersRecipe();
	manager.addEveryone();
	// Check mentioned users, since not all may have a shared inbox.
	await Promise.all(
		notes.concat(cascadingNotes)
			.map(note => getMentionedRemoteUsers(note))
	)
	.then(remoteUsers => {
		remoteUsers.flat()
			.forEach(remoteUser => manager.addDirectRecipe(remoteUser))
	});

	// Actually delete notes from the database.
	// It is important that this is done before delivering the activities.
	// Otherwise there might be a race condition where we tell someone
	// the note exists and they can successfully fetch it.
	await Notes.delete({
		id: In(notes.map(x => x.id)),
		userId: fetchedUser.id,
	});

	// deliver the previously computed content
	await Promise.all([
		manager.execute(),
		deliverMultipleToRelays(user, content),
	]);
}

/**
 * Perform side effects of deletion, such as updating statistics.
 * Does not actually delete the note itself.
 * @param note The soon to be deleted note.
 * @param user The author of said note.
 */
async function deletionSideEffects(note: Note, user: User): Promise<void> {
	const deletedAt = new Date();

	// If this is the only renote of this note by this user
	if (note.renoteId && (await countSameRenotes(user.id, note.renoteId, note.id)) === 0) {
		Notes.decrement({ id: note.renoteId }, 'renoteCount', 1);
		Notes.decrement({ id: note.renoteId }, 'score', 1);
	}

	if (note.replyId) {
		await Notes.decrement({ id: note.replyId }, 'repliesCount', 1);
	}

	publishNoteStream(note.id, 'deleted', { deletedAt });

	// update statistics
	notesChart.update(note, false);
	perUserNotesChart.update(user, note, false);

	if (Users.isRemoteUser(user)) {
		registerOrFetchInstanceDoc(user.host).then(i => {
			Instances.decrement({ id: i.id }, 'notesCount', 1);
			instanceChart.updateNote(i.host, note, false);
		});
	}
}

/**
 * Search for notes that will be affected by ON CASCADE DELETE.
 * However, only notes for which it is relevant to deliver delete activities are searched.
 * This means only local notes that are not local-only are searched.
 */
async function findCascadingNotes(note: Note): Promise<Note[]> {
	const cascadingNotes: Note[] = [];

	const recursive = async (noteId: string): Promise<void> => {
		// FIXME: use note_replies SQL function? Unclear what to do with 2nd and 3rd parameter, maybe rewrite the function.
		const replies = await Notes.find({
			where: [{
				replyId: noteId,
				localOnly: false,
				userHost: IsNull(),
			}, {
				renoteId: noteId,
				text: Not(IsNull()),
				localOnly: false,
				userHost: IsNull(),
			}],
			relations: {
				user: true,
			},
		});

		await Promise.all(replies.map(reply => {
			// only add unique notes
			if (cascadingNotes.some((x) => x.id === reply.id)) return;

			cascadingNotes.push(reply);
			return recursive(reply.id);
		}));
	};
	await recursive(note.id);

	return cascadingNotes;
}

async function getMentionedRemoteUsers(note: Note): Promise<IRemoteUser[]> {
	const where: FindOptionsWhere<User>[] = [];

	// mention / reply / dm
	if (note.mentions.length > 0) {
		where.push({
			id: In(note.mentions),
			// only remote users, local users are on the server and do not need to be notified
			host: Not(IsNull()),
		});
	}

	// renote / quote
	if (note.renoteUserId) {
		where.push({
			id: note.renoteUserId,
		});
	}

	if (where.length === 0) return [];

	return await Users.find({
		where,
	}) as IRemoteUser[];
}
