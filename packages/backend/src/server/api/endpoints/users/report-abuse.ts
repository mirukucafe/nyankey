import sanitizeHtml from 'sanitize-html';
import config from '@/config/index.js';
import { publishAdminStream } from '@/services/stream.js';
import { AbuseUserReports, Users } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { sendEmail } from '@/services/send-email.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { getUser } from '../../common/getters.js';
import { ApiError } from '../../error.js';
import define from '../../define.js';

export const meta = {
	tags: ['users'],

	requireCredential: true,

	description: 'File a report.',

	errors: ['NO_SUCH_USER', 'CANNOT_REPORT_ADMIN', 'CANNOT_REPORT_YOURSELF'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		urls: { type: 'array', items: { type: 'string' }, nullable: true, uniqueItems: true },
		comment: { type: 'string', minLength: 1, maxLength: 2048 },
	},
	required: ['userId', 'comment'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	// Lookup user
	const user = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError('NO_SUCH_USER');
		throw e;
	});

	if (user.id === me.id) throw new ApiError('CANNOT_REPORT_YOURSELF');

	if (user.isAdmin) throw new ApiError('CANNOT_REPORT_ADMIN');

	const uri = user.host == null ? `${config.url}/users/${user.id}` : user.uri;
	if (!ps.urls.includes(uri)) {
		ps.urls.push(uri);
	}

	const report = await AbuseUserReports.insert({
		id: genId(),
		createdAt: new Date(),
		targetUserId: user.id,
		targetUserHost: user.host,
		reporterId: me.id,
		reporterHost: null,
		comment: ps.comment,
		urls: ps.urls,
	}).then(x => AbuseUserReports.findOneByOrFail(x.identifiers[0]));

	// Publish event to moderators
	setImmediate(async () => {
		const moderators = await Users.find({
			where: [{
				isAdmin: true,
			}, {
				isModerator: true,
			}],
		});

		for (const moderator of moderators) {
			publishAdminStream(moderator.id, 'newAbuseUserReport', {
				id: report.id,
				targetUserId: report.targetUserId,
				reporterId: report.reporterId,
				comment: report.comment,
				urls: report.urls,
			});
		}

		const meta = await fetchMeta();
		if (meta.email) {
			sendEmail(meta.email, 'New abuse report',
				sanitizeHtml(ps.comment),
				sanitizeHtml(ps.comment));
		}
	});
});
