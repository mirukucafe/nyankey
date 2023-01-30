import renderDelete from '@/remote/activitypub/renderer/delete.js';
import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import { DeliverManager } from '@/remote/activitypub/deliver-manager.js';
import config from '@/config/index.js';
import { User } from '@/models/entities/user.js';
import { Users } from '@/models/index.js';
import { publishInternalEvent } from '@/services/stream.js';

export async function doPostSuspend(user: { id: User['id']; host: User['host'] }): Promise<void> {
	publishInternalEvent('userChangeSuspendedState', { id: user.id, isSuspended: true });

	if (Users.isLocalUser(user)) {
		const content = renderActivity(renderDelete(`${config.url}/users/${user.id}`, user));

		// deliver to all of known network
		const dm = new DeliverManager(user, content);
		dm.addEveryone();
		await dm.execute();
	}
}
