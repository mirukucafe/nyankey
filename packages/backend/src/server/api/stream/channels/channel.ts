import { Users } from '@/models/index.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { User } from '@/models/entities/user.js';
import { Packed } from '@/misc/schema.js';
import { Note } from '@/models/entities/note.js';
import { StreamMessages } from '../types.js';
import Channel from '../channel.js';

export default class extends Channel {
	public readonly chName = 'channel';
	public static shouldShare = false;
	public static requireCredential = false;
	private channelId: string;
	private typers: Record<User['id'], Date> = {};
	private emitTypersIntervalId: ReturnType<typeof setInterval>;
	private onNote: (note: Note) => Promise<void>;

	constructor(id: string, connection: Channel['connection']) {
		super(id, connection);
		this.onNote = this.withPackedNote(this.onPackedNote.bind(this));
	}

	public async init(params: any) {
		this.channelId = params.channelId as string;

		// Subscribe stream
		this.subscriber.on('notesStream', this.onNote);
		this.subscriber.on(`channelStream:${this.channelId}`, this.onEvent);
		this.emitTypersIntervalId = setInterval(this.emitTypers, 5000);
	}

	private async onPackedNote(note: Packed<'Note'>): Promise<void> {
		if (note.channelId !== this.channelId) return;

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (isUserRelated(note, this.muting)) return;
		// 流れてきたNoteがブロックされているユーザーが関わるものだったら無視する
		if (isUserRelated(note, this.blocking)) return;
		if (note.renote && this.renoteMuting.has(note.userId)) return;

		this.connection.cacheNote(note);

		this.send('note', note);
	}

	private onEvent(data: StreamMessages['channel']['payload']) {
		if (data.type === 'typing') {
			const id = data.body;
			const begin = this.typers[id] == null;
			this.typers[id] = new Date();
			if (begin) {
				this.emitTypers();
			}
		}
	}

	private async emitTypers() {
		const now = new Date();

		// Remove not typing users
		for (const [userId, date] of Object.entries(this.typers)) {
			if (now.getTime() - date.getTime() > 5000) delete this.typers[userId];
		}

		const users = await Users.packMany(Object.keys(this.typers), null, { detail: false });

		this.send({
			type: 'typers',
			body: users,
		});
	}

	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
		this.subscriber.off(`channelStream:${this.channelId}`, this.onEvent);

		clearInterval(this.emitTypersIntervalId);
	}
}
