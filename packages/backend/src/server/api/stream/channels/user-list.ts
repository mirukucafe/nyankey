import { UserListJoinings, UserLists } from '@/models/index.js';
import { User } from '@/models/entities/user.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { Packed } from '@/misc/schema.js';
import { Note } from '@/models/entities/note.js';
import Channel from '../channel.js';

export default class extends Channel {
	public readonly chName = 'userList';
	public static shouldShare = false;
	public static requireCredential = false;
	private listId: string;
	public listUsers: User['id'][] = [];
	private listUsersClock: NodeJS.Timer;
	private onNote: (note: Note) => Promise<void>;

	constructor(id: string, connection: Channel['connection']) {
		super(id, connection);
		this.updateListUsers = this.updateListUsers.bind(this);
		this.onNote = this.withPackedNote(this.onPackedNote.bind(this));
	}

	public async init(params: any) {
		this.listId = params.listId as string;

		// Check existence and owner
		const exists = await UserLists.countBy({
			id: this.listId,
			userId: this.user!.id,
		});
		if (!exists) return;

		// Subscribe stream
		this.subscriber.on(`userListStream:${this.listId}`, this.send);

		this.subscriber.on('notesStream', this.onNote);

		this.updateListUsers();
		this.listUsersClock = setInterval(this.updateListUsers, 5000);
	}

	private async updateListUsers() {
		const users = await UserListJoinings.find({
			where: {
				userListId: this.listId,
			},
			select: ['userId'],
		});

		this.listUsers = users.map(x => x.userId);
	}

	private async onPackedNote(note: Packed<'Note'>): Promise<void> {
		if (!this.listUsers.includes(note.userId)) return;

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (isUserRelated(note, this.muting)) return;
		// 流れてきたNoteがブロックされているユーザーが関わるものだったら無視する
		if (isUserRelated(note, this.blocking)) return;
		if (note.renote && this.renoteMuting.has(note.userId)) return;

		this.send('note', note);
	}

	public dispose() {
		// Unsubscribe events
		this.subscriber.off(`userListStream:${this.listId}`, this.send);
		this.subscriber.off('notesStream', this.onNote);

		clearInterval(this.listUsersClock);
	}
}
