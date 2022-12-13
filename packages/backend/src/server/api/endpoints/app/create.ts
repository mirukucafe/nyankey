import { Apps } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { kinds } from '@/misc/api-permissions.js';
import define from '../../define.js';

export const meta = {
	tags: ['app'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'App',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		description: { type: 'string' },
		permission: {
			type: 'array',
			uniqueItems: true,
			items: {
				type: 'string',
				enum: kinds,
			},
		},
		callbackUrl: { type: 'string', nullable: true },
	},
	required: ['name', 'description', 'permission'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	// Generate secret
	const secret = secureRndstr(32, true);

	// Create account
	const app = await Apps.insert({
		id: genId(),
		createdAt: new Date(),
		userId: user ? user.id : null,
		name: ps.name,
		description: ps.description,
		permission: ps.permission,
		callbackUrl: ps.callbackUrl,
		secret,
	}).then(x => Apps.findOneByOrFail(x.identifiers[0]));

	return await Apps.pack(app, null, {
		detail: true,
		includeSecret: true,
	});
});
