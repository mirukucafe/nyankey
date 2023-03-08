import { Notes } from '@/models/index.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { StreamMessages } from '@/server/api/stream/types.js';
import Channel from '@/server/api/stream/channel.js';

export default class extends Channel {
	public readonly chName = 'antenna';
	public static shouldShare = false;
	public static requireCredential = false;
	private antennaId: string;

	constructor(id: string, connection: Channel['connection']) {
		super(id, connection);
		this.onEvent = this.onEvent.bind(this);
	}

	public async init(params: any) {
		this.antennaId = params.antennaId as string;

		// Subscribe stream
		this.subscriber.on(`antennaStream:${this.antennaId}`, this.onEvent);
	}

	private async onEvent(data: StreamMessages['antenna']['payload']) {
		if (data.type === 'note') {
			try {
				const note = await Notes.pack(data.body.id, this.user, { detail: true });

				// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
				if (isUserRelated(note, this.muting)) return;
				// 流れてきたNoteがブロックされているユーザーが関わるものだったら無視する
				if (isUserRelated(note, this.blocking)) return;
				if (note.renote && this.renoteMuting.has(note.userId)) return;

				this.connection.cacheNote(note);

				this.send('note', note);
			} catch (e) {
				if (e instanceof IdentifiableError && e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') {
					// skip: note not visible to user
					return;
				} else {
					throw e;
				}
			}
		} else {
			this.send(data.type, data.body);
		}
	}

	public dispose() {
		// Unsubscribe events
		this.subscriber.off(`antennaStream:${this.antennaId}`, this.onEvent);
	}
}
