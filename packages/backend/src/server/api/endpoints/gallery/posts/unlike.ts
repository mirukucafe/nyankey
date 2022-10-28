import { GalleryPosts, GalleryLikes } from '@/models/index.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['gallery'],

	requireCredential: true,

	kind: 'write:gallery-likes',

	errors: ['NO_SUCH_POST', 'NOT_LIKED'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		postId: { type: 'string', format: 'misskey:id' },
	},
	required: ['postId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const post = await GalleryPosts.findOneBy({ id: ps.postId });
	if (post == null) throw new ApiError('NO_SUCH_POST');

	const exist = await GalleryLikes.findOneBy({
		postId: post.id,
		userId: user.id,
	});

	if (exist == null) throw new ApiError('NOT_LIKED');

	// Delete like
	await GalleryLikes.delete(exist.id);

	GalleryPosts.decrement({ id: post.id }, 'likedCount', 1);
});
