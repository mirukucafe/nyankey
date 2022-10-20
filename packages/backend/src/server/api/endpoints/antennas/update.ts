import { Antennas, UserLists, UserGroupJoinings } from '@/models/index.js';
import { publishInternalEvent } from '@/services/stream.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['antennas'],

	requireCredential: true,

	kind: 'write:account',

	errors: ['NO_SUCH_ANTENNA', 'NO_SUCH_USER_LIST', 'NO_SUCH_GROUP'],

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
		name: { type: 'string', minLength: 1, maxLength: 100 },
		src: { type: 'string', enum: ['home', 'all', 'users', 'list', 'group'] },
		userListId: { type: 'string', format: 'misskey:id', nullable: true },
		userGroupId: { type: 'string', format: 'misskey:id', nullable: true },
		keywords: { type: 'array', items: {
			type: 'array', items: {
				type: 'string',
			},
		} },
		excludeKeywords: { type: 'array', items: {
			type: 'array', items: {
				type: 'string',
			},
		} },
		users: { type: 'array', items: {
			type: 'string',
		} },
		caseSensitive: { type: 'boolean' },
		withReplies: { type: 'boolean' },
		withFile: { type: 'boolean' },
		notify: { type: 'boolean' },
	},
	required: ['antennaId', 'name', 'src', 'keywords', 'excludeKeywords', 'users', 'caseSensitive', 'withReplies', 'withFile', 'notify'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	// Fetch the antenna
	const antenna = await Antennas.findOneBy({
		id: ps.antennaId,
		userId: user.id,
	});

	if (antenna == null) throw new ApiError('NO_SUCH_ANTENNA');

	let userList;
	let userGroupJoining;

	if (ps.src === 'list' && ps.userListId) {
		userList = await UserLists.findOneBy({
			id: ps.userListId,
			userId: user.id,
		});

		if (userList == null) throw new ApiError('NO_SUCH_USER_LIST');
	} else if (ps.src === 'group' && ps.userGroupId) {
		userGroupJoining = await UserGroupJoinings.findOneBy({
			userGroupId: ps.userGroupId,
			userId: user.id,
		});

		if (userGroupJoining == null) throw new ApiError('NO_SUCH_GROUP');
	}

	await Antennas.update(antenna.id, {
		name: ps.name,
		src: ps.src,
		userListId: userList ? userList.id : null,
		userGroupJoiningId: userGroupJoining ? userGroupJoining.id : null,
		keywords: ps.keywords,
		excludeKeywords: ps.excludeKeywords,
		users: ps.users,
		caseSensitive: ps.caseSensitive,
		withReplies: ps.withReplies,
		withFile: ps.withFile,
		notify: ps.notify,
	});

	publishInternalEvent('antennaUpdated', await Antennas.findOneByOrFail({ id: antenna.id }));

	return await Antennas.pack(antenna.id);
});
