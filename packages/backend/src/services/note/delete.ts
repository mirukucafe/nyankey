import { Brackets, In, IsNull, Not } from 'typeorm';
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
import DeliverManager from '@/remote/activitypub/deliver-manager.js';
import { countSameRenotes } from '@/misc/count-same-renotes.js';
import { isPureRenote } from '@/misc/renote.js';
import { registerOrFetchInstanceDoc } from '../register-or-fetch-instance-doc.js';
import { deliverToRelays } from '../relay.js';

/**
 * 投稿を削除します。
 * @param user 投稿者
 * @param note 投稿
 */
export default async function(user: { id: User['id']; uri: User['uri']; host: User['host']; }, note: Note, quiet = false): Promise<void> {
	const deletedAt = new Date();

	// この投稿を除く指定したユーザーによる指定したノートのリノートが存在しないとき
	if (note.renoteId && (await countSameRenotes(user.id, note.renoteId, note.id)) === 0) {
		Notes.decrement({ id: note.renoteId }, 'renoteCount', 1);
		Notes.decrement({ id: note.renoteId }, 'score', 1);
	}

	if (note.replyId) {
		await Notes.decrement({ id: note.replyId }, 'repliesCount', 1);
	}

	if (!quiet) {
		publishNoteStream(note.id, 'deleted', { deletedAt });

		//#region ローカルの投稿なら削除アクティビティを配送
		if (Users.isLocalUser(user) && !note.localOnly) {
			let renote: Note | null = null;

			// if deletd note is renote
			if (isPureRenote(note)) {
				renote = await Notes.findOneBy({
					id: note.renoteId,
				});
			}

			const content = renderActivity(renote
				? renderUndo(renderAnnounce(renote.uri || `${config.url}/notes/${renote.id}`, note), user)
				: renderDelete(renderTombstone(`${config.url}/notes/${note.id}`), user));

			deliverToConcerned(user, note, content);
		}

		// also deliever delete activity to cascaded notes
		const cascadingNotes = (await findCascadingNotes(note)).filter(note => !note.localOnly); // filter out local-only notes
		for (const cascadingNote of cascadingNotes) {
			if (!cascadingNote.user) continue;
			if (!Users.isLocalUser(cascadingNote.user)) continue;
			const content = renderActivity(renderDelete(renderTombstone(`${config.url}/notes/${cascadingNote.id}`), cascadingNote.user));
			deliverToConcerned(cascadingNote.user, cascadingNote, content);
		}
		//#endregion

		// 統計を更新
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

async function findCascadingNotes(note: Note): Promise<Note[]> {
	const cascadingNotes: Note[] = [];

	const recursive = async (noteId: string): Promise<void> => {
		const query = Notes.createQueryBuilder('note')
			.where('note.replyId = :noteId', { noteId })
			.orWhere(new Brackets(q => {
				q.where('note.renoteId = :noteId', { noteId })
				.andWhere('note.text IS NOT NULL');
			}))
			.leftJoinAndSelect('note.user', 'user');
		const replies = await query.getMany();
		for (const reply of replies) {
			cascadingNotes.push(reply);
			await recursive(reply.id);
		}
	};
	await recursive(note.id);

	return cascadingNotes.filter(note => note.userHost === null); // filter out non-local users
}

async function getMentionedRemoteUsers(note: Note): Promise<IRemoteUser[]> {
	const where = [] as any[];

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
