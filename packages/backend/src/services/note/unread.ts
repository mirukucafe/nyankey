import { Note } from '@/models/entities/note.js';
import { publishMainStream } from '@/services/stream.js';
import { User } from '@/models/entities/user.js';
import { Mutings, NoteThreadMutings, NoteUnreads } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';

export async function insertNoteUnread(userId: User['id'], note: Note, params: {
	// NOTE: isSpecifiedがtrueならisMentionedは必ずfalse
	isSpecified: boolean;
	isMentioned: boolean;
}): Promise<void> {
	//#region ミュートしているなら無視
	// TODO: 現在の仕様ではChannelにミュートは適用されないのでよしなにケアする
	const muted = await Mutings.countBy({
		muterId: userId,
		muteeId: note.userId,
	});
	if (muted) return;
	//#endregion

	const threadMuted = await NoteThreadMutings.countBy({
	// スレッドミュート
		userId,
		threadId: note.threadId || note.id,
	});
	if (threadMuted) return;

	const unread = {
		id: genId(),
		noteId: note.id,
		userId,
		isSpecified: params.isSpecified,
		isMentioned: params.isMentioned,
		noteChannelId: note.channelId,
		noteUserId: note.userId,
	};

	await NoteUnreads.insert(unread);

	// 2秒経っても既読にならなかったら「未読の投稿がありますよ」イベントを発行する
	setTimeout(async () => {
		const exist = await NoteUnreads.countBy({ id: unread.id });

		if (!exist) return;

		if (params.isMentioned) {
			publishMainStream(userId, 'unreadMention', note.id);
		}
		if (params.isSpecified) {
			publishMainStream(userId, 'unreadSpecifiedNote', note.id);
		}
		if (note.channelId) {
			publishMainStream(userId, 'unreadChannel', note.id);
		}
	}, 2000);
}
