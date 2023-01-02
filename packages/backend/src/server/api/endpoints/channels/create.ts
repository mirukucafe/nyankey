import { Channels, DriveFiles } from '@/models/index.js';
import { Channel } from '@/models/entities/channel.js';
import { genId } from '@/misc/gen-id.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['channels'],

	description: 'Creates a new channel with the current user as its administrator.',

	requireCredential: true,

	kind: 'write:channels',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Channel',
	},

	errors: ['NO_SUCH_FILE'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1, maxLength: 128 },
		description: { type: 'string', nullable: true, minLength: 1, maxLength: 2048 },
		bannerId: { type: 'string', format: 'misskey:id', nullable: true },
	},
	required: ['name'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	if (ps.bannerId != null) {
		const bannerExists = await DriveFiles.countBy({
			id: ps.bannerId,
			userId: user.id,
		});

		if (!bannerExists) throw new ApiError('NO_SUCH_FILE');
	}

	const channel = await Channels.insert({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		name: ps.name,
		description: ps.description,
		bannerId: ps.bannerId,
	} as Channel).then(x => Channels.findOneByOrFail(x.identifiers[0]));

	return await Channels.pack(channel, user);
});
