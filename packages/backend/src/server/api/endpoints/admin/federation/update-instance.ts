import { Instances } from '@/models/index.js';
import { toPuny } from '@/misc/convert-host.js';
import { ApiError } from '@/server/api/error.js';
import define from '../../../define.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	errors: ['NO_SUCH_OBJECT'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		host: { type: 'string' },
		isSuspended: { type: 'boolean' },
	},
	required: ['host', 'isSuspended'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const instance = await Instances.findOneBy({ host: toPuny(ps.host) });

	if (instance == null) {
		throw new ApiError('NO_SUCH_OBJECT');
	}

	Instances.update({ host: toPuny(ps.host) }, {
		isSuspended: ps.isSuspended,
	});
});
