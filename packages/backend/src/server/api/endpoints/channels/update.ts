import { Channels, DriveFiles } from '@/models/index.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['channels'],

	requireCredential: true,

	kind: 'write:channels',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Channel',
	},

	errors: ['ACCESS_DENIED', 'NO_SUCH_CHANNEL', 'NO_SUCH_FILE'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		channelId: { type: 'string', format: 'misskey:id' },
		name: { type: 'string', minLength: 1, maxLength: 128 },
		description: { type: 'string', nullable: true, minLength: 1, maxLength: 2048 },
		bannerId: { type: 'string', format: 'misskey:id', nullable: true },
	},
	required: ['channelId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const channel = await Channels.findOneBy({
		id: ps.channelId,
	});

	if (channel == null) throw new ApiError('NO_SUCH_CHANNEL');

	if (channel.userId !== me.id) throw new ApiError('ACCESS_DENIED', 'You are not the owner of this channel.');

	// eslint:disable-next-line:no-unnecessary-initializer
	let banner = undefined;
	if (ps.bannerId != null) {
		banner = await DriveFiles.findOneBy({
			id: ps.bannerId,
			userId: me.id,
		});

		if (banner == null) throw new ApiError('NO_SUCH_FILE');
	} else if (ps.bannerId === null) {
		banner = null;
	}

	await Channels.update(channel.id, {
		...(ps.name !== undefined ? { name: ps.name } : {}),
		...(ps.description !== undefined ? { description: ps.description } : {}),
		...(banner ? { bannerId: banner.id } : {}),
	});

	return await Channels.pack(channel.id, me);
});
