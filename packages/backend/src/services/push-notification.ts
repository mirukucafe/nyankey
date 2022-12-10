import push from 'web-push';
import config from '@/config/index.js';
import { SwSubscriptions } from '@/models/index.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { Packed } from '@/misc/schema.js';
import { getNoteSummary } from '@/misc/get-note-summary.js';

// Defined also packages/sw/types.ts#L14-L21
type pushNotificationsTypes = {
	'notification': Packed<'Notification'>;
	'unreadMessagingMessage': Packed<'MessagingMessage'>;
	'readNotifications': { notificationIds: string[] };
	'readAllNotifications': undefined;
	'readAllMessagingMessages': undefined;
	'readAllMessagingMessagesOfARoom': { userId: string } | { groupId: string };
};

// Reduce the content of the push message because of the character limit
function truncateNotification(notification: Packed<'Notification'>): Record<string, any> {
	if (notification.note) {
		return {
			...notification,
			note: {
				...notification.note,
				// replace text with getNoteSummary
				text: getNoteSummary(notification.type === 'renote' ? notification.note.renote as Packed<'Note'> : notification.note),

				cw: undefined,
				reply: undefined,
				renote: undefined,
				// unnecessary, since usually the user who is receiving the notification knows who they are
				user: undefined as any,
			},
		};
	}

	return notification;
}

export async function pushNotification<T extends keyof pushNotificationsTypes>(userId: string, type: T, body: pushNotificationsTypes[T]): Promise<void> {
	const meta = await fetchMeta();

	// Register key pair information
	push.setVapidDetails(config.url,
		meta.swPublicKey,
		meta.swPrivateKey);

	// Fetch
	const subscriptions = await SwSubscriptions.findBy({ userId });

	for (const subscription of subscriptions) {
		const pushSubscription = {
			endpoint: subscription.endpoint,
			keys: {
				auth: subscription.auth,
				p256dh: subscription.publickey,
			},
		};

		push.sendNotification(pushSubscription, JSON.stringify({
			type,
			body: type === 'notification' ? truncateNotification(body as Packed<'Notification'>) : body,
			userId,
		}), {
			proxy: config.proxy,
		}).catch((err: any) => {
			if (err.statusCode === 410) {
				SwSubscriptions.delete({
					userId,
					endpoint: subscription.endpoint,
					auth: subscription.auth,
					publickey: subscription.publickey,
				});
			}
		});
	}
}
