import { GalleryPosts, GalleryLikes } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['gallery'],

	requireCredential: true,

	kind: 'write:gallery-likes',

	errors: ['NO_SUCH_POST', 'ALREADY_LIKED'],
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

	// if already liked
	const exist = await GalleryLikes.countBy({
		postId: post.id,
		userId: user.id,
	});

	if (exist) throw new ApiError('ALREADY_LIKED');

	// Create like
	await GalleryLikes.insert({
		id: genId(),
		createdAt: new Date(),
		postId: post.id,
		userId: user.id,
	});

	GalleryPosts.increment({ id: post.id }, 'likedCount', 1);
});
