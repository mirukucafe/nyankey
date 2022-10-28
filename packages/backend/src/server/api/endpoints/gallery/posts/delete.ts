import { GalleryPosts } from '@/models/index.js';
import define from '../../../define.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['gallery'],

	requireCredential: true,

	kind: 'write:gallery',

	errors: ['NO_SUCH_POST'],
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
	const post = await GalleryPosts.findOneBy({
		id: ps.postId,
		userId: user.id,
	});

	if (post == null) throw new ApiError('NO_SUCH_POST');

	await GalleryPosts.delete(post.id);
});
