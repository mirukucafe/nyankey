import { Clips } from '@/models/index.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['clips'],

	requireCredential: true,

	kind: 'write:account',

	errors: ['NO_SUCH_CLIP'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Clip',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		clipId: { type: 'string', format: 'misskey:id' },
		name: { type: 'string', minLength: 1, maxLength: 100 },
		isPublic: { type: 'boolean' },
		description: { type: 'string', nullable: true, minLength: 1, maxLength: 2048 },
	},
	required: ['clipId', 'name'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	// Fetch the clip
	const clip = await Clips.findOneBy({
		id: ps.clipId,
		userId: user.id,
	});

	if (clip == null) throw new ApiError('NO_SUCH_CLIP');

	await Clips.update(clip.id, {
		name: ps.name,
		description: ps.description,
		isPublic: ps.isPublic,
	});

	return await Clips.pack(clip.id);
});
