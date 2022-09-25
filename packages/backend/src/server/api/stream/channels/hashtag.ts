import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { Packed } from '@/misc/schema.js';
import { Note } from '@/models/entities/note.js';
import Channel from '../channel.js';

export default class extends Channel {
	public readonly chName = 'hashtag';
	public static shouldShare = false;
	public static requireCredential = false;
	private q: string[][];
	private onNote: (note: Note) => Promise<void>;

	constructor(id: string, connection: Channel['connection']) {
		super(id, connection);
		this.onNote = this.withPackedNote(this.onPackedNote.bind(this));
	}

	public async init(params: any) {
		this.q = params.q;

		if (this.q == null) return;

		// Subscribe stream
		this.subscriber.on('notesStream', this.onNote);
	}

	private async onPackedNote(note: Packed<'Note'>): Promise<void> {
		const noteTags = note.tags ? note.tags.map((t: string) => t.toLowerCase()) : [];
		const matched = this.q.some(tags => tags.every(tag => noteTags.includes(normalizeForSearch(tag))));
		if (!matched) return;

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (isUserRelated(note, this.muting)) return;
		// 流れてきたNoteがブロックされているユーザーが関わるものだったら無視する
		if (isUserRelated(note, this.blocking)) return;
		if (note.renote && this.renoteMuting.has(note.userId)) return;

		this.connection.cacheNote(note);

		this.send('note', note);
	}

	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
	}
}
