import { CacheableRemoteUser } from '@/models/entities/user.js';
import { toArray } from '@/prelude/array.js';
import { Resolver } from '@/remote/activitypub/resolver.js';
import { extractDbHost } from '@/misc/convert-host.js';
import { shouldBlockInstance } from '@/misc/should-block-instance.js';
import { apLogger } from '../logger.js';
import { IObject, isCreate, isDelete, isUpdate, isRead, isFollow, isAccept, isReject, isAdd, isRemove, isAnnounce, isLike, isUndo, isBlock, isCollectionOrOrderedCollection, isCollection, isFlag, getApId } from '../type.js';
import create from './create/index.js';
import performDeleteActivity from './delete/index.js';
import performUpdateActivity from './update/index.js';
import { performReadActivity } from './read.js';
import follow from './follow.js';
import undo from './undo/index.js';
import like from './like.js';
import announce from './announce/index.js';
import accept from './accept/index.js';
import reject from './reject/index.js';
import add from './add/index.js';
import remove from './remove/index.js';
import block from './block/index.js';
import flag from './flag/index.js';

export async function performActivity(actor: CacheableRemoteUser, activity: IObject, resolver: Resolver): Promise<void> {
	if (isCollectionOrOrderedCollection(activity)) {
		for (const item of toArray(isCollection(activity) ? activity.items : activity.orderedItems)) {
			const act = await resolver.resolve(item);
			try {
				await performOneActivity(actor, act, resolver);
			} catch (err) {
				if (err instanceof Error || typeof err === 'string') {
					apLogger.error(err);
				}
			}
		}
	} else {
		await performOneActivity(actor, activity, resolver);
	}
}

async function performOneActivity(actor: CacheableRemoteUser, activity: IObject, resolver: Resolver): Promise<void> {
	if (actor.isSuspended) return;

	if (typeof activity.id !== 'undefined') {
		const host = extractDbHost(getApId(activity));
		if (await shouldBlockInstance(host)) return;
	}

	if (isCreate(activity)) {
		await create(actor, activity, resolver);
	} else if (isDelete(activity)) {
		await performDeleteActivity(actor, activity);
	} else if (isUpdate(activity)) {
		await performUpdateActivity(actor, activity, resolver);
	} else if (isRead(activity)) {
		await performReadActivity(actor, activity);
	} else if (isFollow(activity)) {
		await follow(actor, activity);
	} else if (isAccept(activity)) {
		await accept(actor, activity, resolver);
	} else if (isReject(activity)) {
		await reject(actor, activity, resolver);
	} else if (isAdd(activity)) {
		await add(actor, activity, resolver).catch(err => apLogger.error(err));
	} else if (isRemove(activity)) {
		await remove(actor, activity, resolver).catch(err => apLogger.error(err));
	} else if (isAnnounce(activity)) {
		await announce(actor, activity, resolver);
	} else if (isLike(activity)) {
		await like(actor, activity);
	} else if (isUndo(activity)) {
		await undo(actor, activity, resolver);
	} else if (isBlock(activity)) {
		await block(actor, activity);
	} else if (isFlag(activity)) {
		await flag(actor, activity);
	} else {
		apLogger.warn(`unrecognized activity type: ${(activity as any).type}`);
	}
}
