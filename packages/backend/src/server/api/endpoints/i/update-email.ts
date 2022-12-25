import { publishMainStream } from '@/services/stream.js';
import config from '@/config/index.js';
import { comparePassword } from '@/misc/password.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { Users, UserProfiles } from '@/models/index.js';
import { sendEmail } from '@/services/send-email.js';
import { validateEmailForAccount } from '@/services/validate-email-for-account.js';
import { HOUR } from '@/const.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	requireCredential: true,

	secure: true,

	limit: {
		duration: HOUR,
		max: 3,
	},

	// FIXME: refactor to remove both of these errors?
	// the password should not be passed as it is not compatible with using OAuth
	errors: ['ACCESS_DENIED', 'INTERNAL_ERROR'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		password: { type: 'string' },
		email: { type: 'string', nullable: true },
	},
	required: ['password'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	if (!(await comparePassword(ps.password, profile.password!))) {
		throw new ApiError('ACCESS_DENIED');
	}

	if (ps.email != null) {
		const available = await validateEmailForAccount(ps.email);
		if (!available) throw new ApiError('INTERNAL_ERROR');
	}

	await UserProfiles.update(user.id, {
		email: ps.email,
		emailVerified: false,
		emailVerifyCode: null,
	});

	const iObj = await Users.pack(user.id, user, {
		detail: true,
		includeSecrets: true,
	});

	// Publish meUpdated event
	publishMainStream(user.id, 'meUpdated', iObj);

	if (ps.email != null) {
		const code = secureRndstr(16);

		await UserProfiles.update(user.id, {
			emailVerifyCode: code,
		});

		const link = `${config.url}/verify-email/${code}`;

		sendEmail(ps.email, 'Email verification',
			`To verify email, please click this link:<br><a href="${link}">${link}</a>`,
			`To verify email, please click this link: ${link}`);
	}

	return iObj;
});
