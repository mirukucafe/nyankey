import { publishMainStream } from '@/services/stream.js';
import { pushNotification } from '@/services/push-notification.js';
import { Notifications, Mutings, UserProfiles } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { User } from '@/models/entities/user.js';
import { Notification } from '@/models/entities/notification.js';

export async function createNotification(
	notifieeId: User['id'],
	type: Notification['type'],
	data: Partial<Notification>,
): Promise<Notification | null> {
	if (data.notifierId && (notifieeId === data.notifierId)) {
		return null;
	}

	const profile = await UserProfiles.findOneBy({ userId: notifieeId });

	const isMuted = profile?.mutingNotificationTypes.includes(type);

	// Create notification
	const notification = await Notifications.insert({
		id: genId(),
		createdAt: new Date(),
		notifieeId,
		type,
		// If the other party seems to have muted this notification, pre-read it.
		isRead: isMuted,
		...data,
	} as Partial<Notification>)
		.then(x => Notifications.findOneByOrFail(x.identifiers[0]));

	const packed = await Notifications.pack(notification, {});

	// Publish notification event
	publishMainStream(notifieeId, 'notification', packed);

	// If the notification (created this time) has not been read after 2 seconds, issue a "You have unread notifications" event.
	setTimeout(async () => {
		const fresh = await Notifications.findOneBy({ id: notification.id });
		if (fresh == null) return; // It may have already been deleted.
		if (fresh.isRead) return;

		//#region However, if the notification comes from a muted user, ignore it.
		const mutings = await Mutings.findBy({
			muterId: notifieeId,
		});
		if (data.notifierId && mutings.map(m => m.muteeId).includes(data.notifierId)) {
			return;
		}
		//#endregion

		publishMainStream(notifieeId, 'unreadNotification', packed);
		pushNotification(notifieeId, 'notification', packed);
	}, 2000);

	return notification;
}
