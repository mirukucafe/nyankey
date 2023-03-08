import { Antennas } from '@/models/index.js';
import define from '@/server/api/define.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['antennas', 'account'],

	requireCredential: true,

	kind: 'read:account',

	errors: ['NO_SUCH_ANTENNA'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Antenna',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		antennaId: { type: 'string', format: 'misskey:id' },
	},
	required: ['antennaId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	// Fetch the antenna
	const antenna = await Antennas.findOneBy({
		id: ps.antennaId,
		userId: me.id,
	});

	if (antenna == null) throw new ApiError('NO_SUCH_ANTENNA');

	return await Antennas.pack(antenna);
});
