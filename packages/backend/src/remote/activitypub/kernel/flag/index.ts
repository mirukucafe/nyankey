import { In } from 'typeorm';
import config from '@/config/index.js';
import { genId } from '@/misc/gen-id.js';
import { IRemoteUser } from '@/models/entities/user.js';
import { AbuseUserReports, Users } from '@/models/index.js';
import { IFlag, getApIds } from '@/remote/activitypub/type.js';

export default async (actor: IRemoteUser, activity: IFlag): Promise<string> => {
	// The object is `(User|Note) | (User|Note)[]`, but since the database schema
	// cannot be made to handle every possible case, the target user is the first user
	// and everything else is stored by URL.
	const uris = getApIds(activity.object);

	const userIds = uris.filter(uri => uri.startsWith(config.url + '/users/')).map(uri => uri.split('/').pop()!);
	const users = await Users.findBy({
		id: In(userIds),
	});
	if (users.length < 1) return 'skip';

	await AbuseUserReports.insert({
		id: genId(),
		createdAt: new Date(),
		targetUserId: users[0].id,
		targetUserHost: users[0].host,
		reporterId: actor.id,
		reporterHost: actor.host,
		comment: activity.content,
		urls: uris.filter(uri => !uri.startsWith(config.url + '/users/')),
	});

	return 'ok';
};
