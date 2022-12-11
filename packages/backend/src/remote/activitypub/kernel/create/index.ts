import { CacheableRemoteUser } from '@/models/entities/user.js';
import { toArray, concat, unique } from '@/prelude/array.js';
import { Resolver } from '@/remote/activitypub/resolver.js';
import { ICreate, getApId, isPost, getApType } from '../../type.js';
import { apLogger } from '../../logger.js';
import createNote from './note.js';

export default async (actor: CacheableRemoteUser, activity: ICreate, resolver: Resolver): Promise<void> => {
	const uri = getApId(activity);

	apLogger.info(`Create: ${uri}`);

	// copy audiences between activity <=> object.
	if (typeof activity.object === 'object') {
		const to = unique(concat([toArray(activity.to), toArray(activity.object.to)]));
		const cc = unique(concat([toArray(activity.cc), toArray(activity.object.cc)]));

		activity.to = to;
		activity.cc = cc;
		activity.object.to = to;
		activity.object.cc = cc;
	}

	// If there is no attributedTo, use Activity actor.
	if (typeof activity.object === 'object' && !activity.object.attributedTo) {
		activity.object.attributedTo = activity.actor;
	}

	const object = await resolver.resolve(activity.object).catch(e => {
		apLogger.error(`Resolution failed: ${e}`);
		throw e;
	});

	if (isPost(object)) {
		createNote(resolver, actor, object, false, activity);
	} else {
		apLogger.warn(`Unknown type: ${getApType(object)}`);
	}
};
