import config from '@/config/index.js';
import { Relay } from '@/models/entities/relay.js';
import { ILocalUser } from '@/models/entities/user.js';

export type FollowRelay = {
	id: string;
	type: 'Follow';
	actor: string;
	object: 'https://www.w3.org/ns/activitystreams#Public';
};

export function renderFollowRelay(relay: Relay, relayActor: ILocalUser): FollowRelay {
	const follow = {
		id: `${config.url}/activities/follow-relay/${relay.id}`,
		type: 'Follow',
		actor: `${config.url}/users/${relayActor.id}`,
		object: 'https://www.w3.org/ns/activitystreams#Public',
	} as const;

	return follow;
}
