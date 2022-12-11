import post from '@/services/note/create.js';
import { CacheableRemoteUser } from '@/models/entities/user.js';
import { extractDbHost } from '@/misc/convert-host.js';
import { getApLock } from '@/misc/app-lock.js';
import { StatusError } from '@/misc/fetch.js';
import { Notes } from '@/models/index.js';
import { parseAudience } from '@/remote/activitypub/audience.js';
import { apLogger } from '@/remote/activitypub/logger.js';
import { fetchNote, resolveNote } from '@/remote/activitypub/models/note.js';
import { Resolver } from '@/remote/activitypub/resolver.js';
import { IAnnounce, getApId } from '@/remote/activitypub/type.js';
import { shouldBlockInstance } from '@/misc/should-block-instance.js';

export default async function(resolver: Resolver, actor: CacheableRemoteUser, activity: IAnnounce, targetUri: string): Promise<void> {
	const uri = getApId(activity);

	if (actor.isSuspended) {
		return;
	}

	// Cancel if the announced from host is blocked.
	if (await shouldBlockInstance(extractDbHost(uri))) return;

	const unlock = await getApLock(uri);

	try {
		// Check if this has already been announced.
		const exist = await fetchNote(uri);
		if (exist) {
			return;
		}

		// resolve the announce target
		let renote;
		try {
			renote = await resolveNote(targetUri, resolver);
		} catch (e) {
			// skip if the target returns a HTTP client error
			if (e instanceof StatusError) {
				if (e.isClientError) {
					apLogger.warn(`Ignored announce target ${targetUri} - ${e.statusCode}`);
					return;
				}

				apLogger.warn(`Error in announce target ${targetUri} - ${e.statusCode || e}`);
			}
			throw e;
		}

		if (!await Notes.isVisibleForMe(renote, actor.id)) return 'skip: invalid actor for this activity';

		apLogger.info(`Creating the (Re)Note: ${uri}`);

		const activityAudience = await parseAudience(actor, activity.to, activity.cc);

		await post(actor, {
			createdAt: activity.published ? new Date(activity.published) : null,
			renote,
			visibility: activityAudience.visibility,
			visibleUsers: activityAudience.visibleUsers,
			uri,
		});
	} finally {
		unlock();
	}
}
