import { Channels, ChannelFollowings } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { publishUserEvent } from '@/services/stream.js';
import define from '@/server/api/define.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['channels'],

	requireCredential: true,

	kind: 'write:channels',

	errors: ['NO_SUCH_CHANNEL'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		channelId: { type: 'string', format: 'misskey:id' },
	},
	required: ['channelId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const channel = await Channels.findOneBy({
		id: ps.channelId,
	});

	if (channel == null) throw new ApiError('NO_SUCH_CHANNEL');

	await ChannelFollowings.insert({
		id: genId(),
		createdAt: new Date(),
		followerId: user.id,
		followeeId: channel.id,
	});

	publishUserEvent(user.id, 'followChannel', channel);
});
