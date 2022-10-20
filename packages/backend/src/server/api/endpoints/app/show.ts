import { Apps } from '@/models/index.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['app'],

	errors: ['NO_SUCH_APP'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'App',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		appId: { type: 'string', format: 'misskey:id' },
	},
	required: ['appId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user, token) => {
	const isSecure = user != null && token == null;

	// Lookup app
	const app = await Apps.findOneBy({ id: ps.appId });

	if (app == null) throw new ApiError('NO_SUCH_APP');

	return await Apps.pack(app, user, {
		detail: true,
		includeSecret: isSecure && (app.userId === user!.id),
	});
});
