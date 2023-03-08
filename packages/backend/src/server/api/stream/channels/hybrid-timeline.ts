import { fetchMeta } from '@/misc/fetch-meta.js';
import { checkWordMute } from '@/misc/check-word-mute.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { isInstanceMuted } from '@/misc/is-instance-muted.js';
import { Packed } from '@/misc/schema.js';
import { Note } from '@/models/entities/note.js';
import Channel from '@/server/api/stream/channel.js';

export default class extends Channel {
	public readonly chName = 'hybridTimeline';
	public static shouldShare = true;
	public static requireCredential = true;
	private onNote: (note: Note) => Promise<void>;

	constructor(id: string, connection: Channel['connection']) {
		super(id, connection);
		this.onNote = this.withPackedNote(this.onPackedNote.bind(this));
	}

	public async init() {
		const meta = await fetchMeta();
		if (meta.disableLocalTimeline && !this.user!.isAdmin && !this.user!.isModerator) return;

		// Subscribe events
		this.subscriber.on('notesStream', this.onNote);
	}

	private async onPackedNote(note: Packed<'Note'>): Promise<void> {
		// チャンネルの投稿ではなく、自分自身の投稿 または
		// チャンネルの投稿ではなく、その投稿のユーザーをフォローしている または
		// チャンネルの投稿ではなく、全体公開のローカルの投稿 または
		// フォローしているチャンネルの投稿 の場合だけ
		if (!(
			(note.channelId == null && this.user!.id === note.userId) ||
			(note.channelId == null && this.following.has(note.userId)) ||
			(note.channelId == null && (note.user.host == null && note.visibility === 'public')) ||
			(note.channelId != null && this.followingChannels.has(note.channelId))
		)) return;

		// Ignore notes from instances the user has muted
		if (isInstanceMuted(note, new Set<string>(this.userProfile?.mutedInstances ?? []))) return;

		// 関係ない返信は除外
		if (note.reply && !this.user!.showTimelineReplies) {
			const reply = note.reply;
			// 「チャンネル接続主への返信」でもなければ、「チャンネル接続主が行った返信」でもなければ、「投稿者の投稿者自身への返信」でもない場合
			if (reply.userId !== this.user!.id && note.userId !== this.user!.id && reply.userId !== note.userId) return;
		}

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (isUserRelated(note, this.muting)) return;
		// 流れてきたNoteがブロックされているユーザーが関わるものだったら無視する
		if (isUserRelated(note, this.blocking)) return;
		if (note.renote && this.renoteMuting.has(note.userId)) return;

		// 流れてきたNoteがミュートすべきNoteだったら無視する
		// TODO: 将来的には、単にMutedNoteテーブルにレコードがあるかどうかで判定したい(以下の理由により難しそうではある)
		// 現状では、ワードミュートにおけるMutedNoteレコードの追加処理はストリーミングに流す処理と並列で行われるため、
		// レコードが追加されるNoteでも追加されるより先にここのストリーミングの処理に到達することが起こる。
		// そのためレコードが存在するかのチェックでは不十分なので、改めてcheckWordMuteを呼んでいる
		if (this.userProfile && await checkWordMute(note, this.user, this.userProfile.mutedWords)) return;

		this.connection.cacheNote(note);

		this.send('note', note);
	}

	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
	}
}
