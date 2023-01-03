import { genId } from '@/misc/gen-id.js';
import { AnnouncementReads, Announcements, Users } from '@/models/index.js';
import { publishMainStream } from '@/services/stream.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'write:account',

	errors: ['NO_SUCH_ANNOUNCEMENT'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		announcementId: { type: 'string', format: 'misskey:id' },
	},
	required: ['announcementId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	// Check if announcement exists
	const exists = await Announcements.countBy({ id: ps.announcementId });

	if (!exists) throw new ApiError('NO_SUCH_ANNOUNCEMENT');

	// Check if already read
	const read = await AnnouncementReads.countBy({
		announcementId: ps.announcementId,
		userId: user.id,
	});

	if (read) return;

	// Create read
	await AnnouncementReads.insert({
		id: genId(),
		createdAt: new Date(),
		announcementId: ps.announcementId,
		userId: user.id,
	});

	if (!await Users.getHasUnreadAnnouncement(user.id)) {
		publishMainStream(user.id, 'readAllAnnouncements');
	}
});
