import { hashPassword } from '@/misc/password.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { Users, UserProfiles } from '@/models/index.js';
import { ApiError } from '@/server/api/error.js';
import define from '../../define.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			password: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
	},

	errors: ['NO_SUCH_USER', 'IS_ADMIN'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	const user = await Users.findOneBy({ id: ps.userId });

	if (user == null) {
		throw new ApiError('NO_SUCH_USER');
	}

	if (user.isAdmin) {
		throw new ApiError('IS_ADMIN');
	}

	const password = secureRndstr(8, true);

	await UserProfiles.update({
		userId: user.id,
	}, {
		password: await hashPassword(password),
	});

	return {
		password,
	};
});
