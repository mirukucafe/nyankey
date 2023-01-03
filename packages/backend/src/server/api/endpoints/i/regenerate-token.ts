import { comparePassword } from '@/misc/password.js';
import { publishInternalEvent, publishMainStream, publishUserEvent } from '@/services/stream.js';
import { Users, UserProfiles } from '@/models/index.js';
import { ApiError } from '@/server/api/error.js';
import generateUserToken from '../../common/generate-native-user-token.js';
import define from '../../define.js';

export const meta = {
	requireCredential: true,

	secure: true,

	errors: ['ACCESS_DENIED'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		password: { type: 'string' },
	},
	required: ['password'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const freshUser = await Users.findOneByOrFail({ id: user.id });
	const oldToken = freshUser.token;

	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	if (!(await comparePassword(ps.password, profile.password!))) {
		throw new ApiError('ACCESS_DENIED');
	}

	const newToken = generateUserToken();

	await Users.update(user.id, {
		token: newToken,
	});

	// Publish event
	publishInternalEvent('userTokenRegenerated', { id: user.id, oldToken, newToken });
	publishMainStream(user.id, 'myTokenRegenerated');

	// Terminate streaming
	setTimeout(() => {
		publishUserEvent(user.id, 'terminate', {});
	}, 5000);
});
