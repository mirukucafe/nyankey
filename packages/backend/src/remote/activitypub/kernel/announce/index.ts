import { CacheableRemoteUser } from '@/models/entities/user.js';
import { apLogger } from '@/remote/activitypub/logger.js';
import { Resolver } from '@/remote/activitypub/resolver.js';
import { IAnnounce, getApId } from '@/remote/activitypub/type.js';
import announceNote from './note.js';

export default async (actor: CacheableRemoteUser, activity: IAnnounce, resolver: Resolver): Promise<void> => {
	const uri = getApId(activity);

	apLogger.info(`Announce: ${uri}`);

	const targetUri = getApId(activity.object);

	announceNote(resolver, actor, activity, targetUri);
};
