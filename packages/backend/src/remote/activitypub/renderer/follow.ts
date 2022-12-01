import config from '@/config/index.js';
import { User } from '@/models/entities/user.js';
import { Users } from '@/models/index.js';

/**
 * Renders a follow activity.
 * @param follower user that is (trying to) follow someone
 * @param followee the user that is (trying to) be followed
 * @param requestId: ID of this follow. If undefined and follower is local, will be generated.
 */
export default (follower: { id: User['id']; host: User['host']; uri: User['host'] }, followee: { id: User['id']; host: User['host']; uri: User['host'] }, requestId?: string) => {
	let id = requestId;

	if (id == null && follower.host == null) {
		/*
		Generate an id only if the follower is local.
		Otherwise we may try to generate an ID for a remote activity,
		in which case its better not to put an id at all.

		Why IDs must be generated: https://github.com/misskey-dev/misskey/issues/8655
		Why IDs must not be generated for remote activities: https://akkoma.dev/FoundKeyGang/FoundKey/issues/263
		*/
		id = `${config.url}/follows/${follower.id}/${followee.id}`;
	}

	const follow = {
		id,
		type: 'Follow',
		actor: Users.isLocalUser(follower) ? `${config.url}/users/${follower.id}` : follower.uri,
		object: Users.isLocalUser(followee) ? `${config.url}/users/${followee.id}` : followee.uri,
	} as any;

	return follow;
};
