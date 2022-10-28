import define from '../../define.js';
import { readNotification } from '../../common/read-notification.js';

export const meta = {
	tags: ['notifications', 'account'],

	requireCredential: true,

	kind: 'write:notifications',

	description: 'Mark a notification as read.',

	// FIXME: This error makes sense here but will never be thrown here.
	// errors: ['NO_SUCH_NOTIFICATION'],
} as const;

export const paramDef = {
	oneOf: [
		{
			type: 'object',
			properties: {
				notificationId: { type: 'string', format: 'misskey:id' },
			},
			required: ['notificationId'],
		},
		{
			type: 'object',
			properties: {
				notificationIds: {
					type: 'array',
					items: { type: 'string', format: 'misskey:id' },
					maxItems: 100,
				},
			},
			required: ['notificationIds'],
		},
	],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	if ('notificationId' in ps) return readNotification(user.id, [ps.notificationId]);
	return readNotification(user.id, ps.notificationIds);
});
