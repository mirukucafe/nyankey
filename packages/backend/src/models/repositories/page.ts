import { db } from '@/db/postgre.js';
import { Page } from '@/models/entities/page.js';
import { Packed } from '@/misc/schema.js';
import { awaitAll } from '@/prelude/await-all.js';
import { User } from '@/models/entities/user.js';
import { Users, DriveFiles, PageLikes } from '../index.js';

export const PageRepository = db.getRepository(Page).extend({
	async pack(
		src: Page['id'] | Page,
		me?: { id: User['id'] } | null | undefined,
	): Promise<Packed<'Page'>> {
		const meId = me ? me.id : null;
		const page = typeof src === 'object' ? src : await this.findOneByOrFail({ id: src });

		return await awaitAll({
			id: page.id,
			createdAt: page.createdAt.toISOString(),
			updatedAt: page.updatedAt.toISOString(),
			userId: page.userId,
			user: Users.pack(page.user || page.userId, me), // { detail: true } すると無限ループするので注意
			text: page.text,
			title: page.title,
			name: page.name,
			summary: page.summary,
			hideTitleWhenPinned: page.hideTitleWhenPinned,
			alignCenter: page.alignCenter,
			font: page.font,
			eyeCatchingImageId: page.eyeCatchingImageId,
			eyeCatchingImage: page.eyeCatchingImageId ? await DriveFiles.pack(page.eyeCatchingImageId) : null,
			likedCount: page.likedCount,
			isLiked: meId ? await PageLikes.findOneBy({ pageId: page.id, userId: meId }).then(x => x != null) : undefined,
		});
	},

	packMany(
		pages: Page[],
		me?: { id: User['id'] } | null | undefined,
	) {
		return Promise.all(pages.map(x => this.pack(x, me)));
	},
});
