import { Antenna } from '@/models/entities/antenna.js';
import { Note } from '@/models/entities/note.js';
import { AntennaNotes, Mutings, Notes } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { publishAntennaStream, publishMainStream } from '@/services/stream.js';
import { User } from '@/models/entities/user.js';
import { SECOND } from '@/const.js';

export async function addNoteToAntenna(antenna: Antenna, note: Note, noteUser: { id: User['id']; }): Promise<void> {
	// If it's set to not notify the user, or if it's the user's own post, read it.
	const read = !antenna.notify || (antenna.userId === noteUser.id);

	AntennaNotes.insert({
		id: genId(),
		antennaId: antenna.id,
		noteId: note.id,
		read,
	});

	publishAntennaStream(antenna.id, 'note', note);

	if (!read) {
		const mutings = await Mutings.find({
			where: {
				muterId: antenna.userId,
			},
			select: ['muteeId'],
		});

		// Copy
		const _note: Note = {
			...note,
		};

		if (note.replyId != null) {
			_note.reply = await Notes.findOneByOrFail({ id: note.replyId });
		}
		if (note.renoteId != null) {
			_note.renote = await Notes.findOneByOrFail({ id: note.renoteId });
		}

		if (isUserRelated(_note, new Set<string>(mutings.map(x => x.muteeId)))) {
			return;
		}

		// Notify if not read after 2 seconds
		setTimeout(async () => {
			const unread = await AntennaNotes.countBy({ antennaId: antenna.id, read: false });
			if (unread) {
				publishMainStream(antenna.userId, 'unreadAntenna', antenna);
			}
		}, 2 * SECOND);
	}
}
