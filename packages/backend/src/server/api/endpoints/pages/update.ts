import { Not } from 'typeorm';
import { Pages, DriveFiles } from '@/models/index.js';
import { HOUR } from '@/const.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['pages'],

	requireCredential: true,

	kind: 'write:pages',

	limit: {
		duration: HOUR,
		max: 300,
	},

	errors: ['NAME_ALREADY_EXISTS', 'NO_SUCH_FILE', 'NO_SUCH_PAGE'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		pageId: { type: 'string', format: 'misskey:id' },
		title: { type: 'string' },
		name: { type: 'string', minLength: 1 },
		summary: { type: 'string', nullable: true },
		text: { type: 'string', minLength: 1 },
		eyeCatchingImageId: { type: 'string', format: 'misskey:id', nullable: true },
		font: { type: 'string', enum: ['serif', 'sans-serif'] },
		alignCenter: { type: 'boolean' },
		hideTitleWhenPinned: { type: 'boolean' },
	},
	required: ['pageId', 'title', 'name', 'text'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const page = await Pages.findOneBy({
		id: ps.pageId,
		userId: user.id,
	});
	if (page == null) throw new ApiError('NO_SUCH_PAGE');

	let eyeCatchingImage = null;
	if (ps.eyeCatchingImageId != null) {
		eyeCatchingImage = await DriveFiles.findOneBy({
			id: ps.eyeCatchingImageId,
			userId: user.id,
		});

		if (eyeCatchingImage == null) throw new ApiError('NO_SUCH_FILE');
	}

	await Pages.findBy({
		id: Not(ps.pageId),
		userId: user.id,
		name: ps.name,
	}).then(result => {
		if (result.length > 0) throw new ApiError('NAME_ALREADY_EXISTS');
	});

	await Pages.update(page.id, {
		updatedAt: new Date(),
		title: ps.title,
		name: ps.name === undefined ? page.name : ps.name,
		summary: ps.name === undefined ? page.summary : ps.summary,
		text: ps.text,
		alignCenter: ps.alignCenter === undefined ? page.alignCenter : ps.alignCenter,
		hideTitleWhenPinned: ps.hideTitleWhenPinned === undefined ? page.hideTitleWhenPinned : ps.hideTitleWhenPinned,
		font: ps.font === undefined ? page.font : ps.font,
		eyeCatchingImageId: ps.eyeCatchingImageId === null
			? null
			: ps.eyeCatchingImageId === undefined
				? page.eyeCatchingImageId
				: eyeCatchingImage!.id,
	});
});
