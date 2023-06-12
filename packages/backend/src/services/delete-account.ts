import { AccessTokens, Users } from '@/models/index.js';
import { createDeleteAccountJob } from '@/queue/index.js';
import { publishUserEvent } from './stream.js';
import { doPostSuspend } from './suspend-user.js';

export async function deleteAccount(user: {
	id: string;
	host: string | null;
}): Promise<void> {
	await Promise.all([
		Users.update(user.id, {
			isDeleted: -1,
		}),
		// revoke all of the users access tokens to block API access
		AccessTokens.delete({
			userId: user.id,
		}),
	]);

	if (Users.isLocalUser(user)) {
		// Terminate streaming
		publishUserEvent(user.id, 'terminate', {});
	}

	// Send Delete activity before physical deletion
	await doPostSuspend(user).catch(() => {});

	createDeleteAccountJob(user, {
		// Deleting remote users is specified as SOFT, because if they are physically deleted
		// from the DB completely, they may be reassociated and their accounts may be reinstated.
		soft: Users.isLocalUser(user),
	});
}
