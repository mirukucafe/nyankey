import { IsNull } from 'typeorm';
import { ILocalUser } from '@/models/entities/user.js';
import { Users } from '@/models/index.js';
import { getSystemUser } from './system-user.js';

const ACTOR_USERNAME = 'instance.actor' as const;

let instanceActor = await Users.findOneBy({
	host: IsNull(),
	username: ACTOR_USERNAME,
}) as ILocalUser | undefined;

export async function getInstanceActor(): Promise<ILocalUser> {
	if (!instanceActor) {
		instanceActor = await getSystemUser(ACTOR_USERNAME) as ILocalUser;
	}

	return instanceActor;
}
