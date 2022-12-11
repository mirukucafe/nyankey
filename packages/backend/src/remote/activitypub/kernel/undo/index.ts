import { CacheableRemoteUser } from '@/models/entities/user.js';
import { apLogger } from '@/remote/activitypub/logger.js';
import { Resolver } from '@/remote/activitypub/resolver.js';
import { IUndo, isFollow, isBlock, isLike, isAnnounce, getApType, isAccept } from '@/remote/activitypub/type.js';
import unfollow from './follow.js';
import unblock from './block.js';
import undoLike from './like.js';
import undoAccept from './accept.js';
import { undoAnnounce } from './announce.js';

export default async (actor: CacheableRemoteUser, activity: IUndo, resolver: Resolver): Promise<string> => {
	if ('actor' in activity && actor.uri !== activity.actor) {
		throw new Error('invalid actor');
	}

	const uri = activity.id || activity;

	apLogger.info(`Undo: ${uri}`);

	const object = await resolver.resolve(activity.object).catch(e => {
		apLogger.error(`Resolution failed: ${e}`);
		throw e;
	});

	if (isFollow(object)) return await unfollow(actor, object);
	if (isBlock(object)) return await unblock(actor, object);
	if (isLike(object)) return await undoLike(actor, object);
	if (isAnnounce(object)) return await undoAnnounce(actor, object);
	if (isAccept(object)) return await undoAccept(actor, object);

	return `skip: unknown object type ${getApType(object)}`;
};
