import { GalleryPosts } from '@/models/index.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['gallery'],

	requireCredential: false,

	errors: ['NO_SUCH_POST'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'GalleryPost',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		postId: { type: 'string', format: 'misskey:id' },
	},
	required: ['postId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const post = await GalleryPosts.findOneBy({
		id: ps.postId,
	});

	if (post == null) throw new ApiError('NO_SUCH_POST');

	return await GalleryPosts.pack(post, me);
});
