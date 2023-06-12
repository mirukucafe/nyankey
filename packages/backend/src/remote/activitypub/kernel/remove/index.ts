import { IRemoteUser } from '@/models/entities/user.js';
import { removePinned } from '@/services/i/pin.js';
import { Resolver } from '@/remote/activitypub/resolver.js';
import { IRemove } from '../../type.js';
import { resolveNote } from '../../models/note.js';

export default async (actor: IRemoteUser, activity: IRemove, resolver: Resolver): Promise<void> => {
	if ('actor' in activity && actor.uri !== activity.actor) {
		throw new Error('invalid actor');
	}

	if (activity.target == null) {
		throw new Error('target is null');
	}

	if (activity.target === actor.featured) {
		const note = await resolveNote(activity.object, resolver);
		if (note == null) throw new Error('note not found');
		await removePinned(actor, note.id);
		return;
	}

	throw new Error(`unknown target: ${activity.target}`);
};
