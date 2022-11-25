import { IsNull } from 'typeorm';
import { ILocalUser } from '@/models/entities/user.js';
import { Users } from '@/models/index.js';
import { createSystemUser } from './create-system-user.js';

const ACTOR_USERNAME = 'instance.actor' as const;

let instanceActor = await Users.findOneBy({
	host: IsNull(),
	username: ACTOR_USERNAME,
}) as ILocalUser | undefined;

export async function getInstanceActor(): Promise<ILocalUser> {
	if (!instanceActor) {
		instanceActor = await createSystemUser(ACTOR_USERNAME) as ILocalUser;
	}

	return instanceActor;
}
