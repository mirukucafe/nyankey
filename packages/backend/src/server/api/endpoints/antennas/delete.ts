import { Antennas } from '@/models/index.js';
import { publishInternalEvent } from '@/services/stream.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['antennas'],

	requireCredential: true,

	kind: 'write:account',

	errors: ['NO_SUCH_ANTENNA'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		antennaId: { type: 'string', format: 'misskey:id' },
	},
	required: ['antennaId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const antenna = await Antennas.findOneBy({
		id: ps.antennaId,
		userId: user.id,
	});

	if (antenna == null) throw new ApiError('NO_SUCH_ANTENNA');

	await Antennas.delete(antenna.id);

	publishInternalEvent('antennaDeleted', antenna);
});
