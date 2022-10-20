import { Clips } from '@/models/index.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['clips', 'account'],

	requireCredential: false,

	kind: 'read:account',

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
	},
	required: ['clipId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	// Fetch the clip
	const clip = await Clips.findOneBy({
		id: ps.clipId,
	});

	if (clip == null) throw new ApiError('NO_SUCH_CLIP');

	if (!clip.isPublic && (me == null || (clip.userId !== me.id))) {
		throw new ApiError('NO_SUCH_CLIP');
	}

	return await Clips.pack(clip);
});
