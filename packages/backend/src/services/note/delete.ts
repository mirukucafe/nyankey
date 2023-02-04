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
import { deliverToRelays } from '../relay.js';

/**
 * Delete your note.
 * @param user author
 * @param note note to be deleted
 */
export default async function(user: { id: User['id']; uri: User['uri']; host: User['host']; }, note: Note, quiet = false): Promise<void> {
	const deletedAt = new Date();

	// If this is the only renote of this note by this user
	if (note.renoteId && (await countSameRenotes(user.id, note.renoteId, note.id)) === 0) {
		Notes.decrement({ id: note.renoteId }, 'renoteCount', 1);
		Notes.decrement({ id: note.renoteId }, 'score', 1);
	}

	if (note.replyId) {
		await Notes.decrement({ id: note.replyId }, 'repliesCount', 1);
	}

	if (!quiet) {
		publishNoteStream(note.id, 'deleted', { deletedAt });

		// deliver delete activity of note itself for local posts
		if (Users.isLocalUser(user) && !note.localOnly) {
			let renote: Note | null = null;

			// if deleted note is renote
			if (foundkey.entities.isPureRenote(note)) {
				renote = await Notes.findOneBy({ id: note.renoteId });
			}

			const content = renderActivity(renote
				? renderUndo(renderAnnounce(renote.uri || `${config.url}/notes/${renote.id}`, note), user)
				: renderDelete(renderTombstone(`${config.url}/notes/${note.id}`), user));

			deliverToConcerned(user, note, content);
		}

		// also deliver delete activity to cascaded notes
		const cascadingNotes = await findCascadingNotes(note);
		for (const cascadingNote of cascadingNotes) {
			const content = renderActivity(renderDelete(renderTombstone(`${config.url}/notes/${cascadingNote.id}`), cascadingNote.user));
			deliverToConcerned(cascadingNote.user, cascadingNote, content);
		}

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

	await Notes.delete({
		id: note.id,
		userId: user.id,
	});
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
			if (cascadingNotes.find((x) => x.id === reply.id) != null) return;

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

async function deliverToConcerned(user: { id: ILocalUser['id']; host: null; }, note: Note, content: any): Promise<void> {
	const manager = new DeliverManager(user, content);

	const remoteUsers = await getMentionedRemoteUsers(note);
	for (const remoteUser of remoteUsers) {
		manager.addDirectRecipe(remoteUser);
	}

	if (['public', 'home', 'followers'].includes(note.visibility)) {
		manager.addFollowersRecipe();
	}

	if (['public', 'home'].includes(note.visibility)) {
		manager.addEveryone();
	}

	await manager.execute();

	deliverToRelays(user, content);
}
