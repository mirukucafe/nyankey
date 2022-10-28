import { Pages, DriveFiles } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { Page } from '@/models/entities/page.js';
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

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Page',
	},

	errors: ['NO_SUCH_FILE', 'NAME_ALREADY_EXISTS'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		title: { type: 'string' },
		name: { type: 'string', minLength: 1 },
		summary: { type: 'string', nullable: true },
		text: { type: 'string', minLength: 1 },
		eyeCatchingImageId: { type: 'string', format: 'misskey:id', nullable: true },
		font: { type: 'string', enum: ['serif', 'sans-serif'], default: 'sans-serif' },
		alignCenter: { type: 'boolean', default: false },
		hideTitleWhenPinned: { type: 'boolean', default: false },
	},
	required: ['title', 'name', 'text'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	let eyeCatchingImage = null;
	if (ps.eyeCatchingImageId != null) {
		eyeCatchingImage = await DriveFiles.findOneBy({
			id: ps.eyeCatchingImageId,
			userId: user.id,
		});

		if (eyeCatchingImage == null) throw new ApiError('NO_SUCH_FILE');
	}

	await Pages.findBy({
		userId: user.id,
		name: ps.name,
	}).then(result => {
		if (result.length > 0) {
			throw new ApiError('NAME_ALREADY_EXISTS');
		}
	});

	const page = await Pages.insert(new Page({
		id: genId(),
		createdAt: new Date(),
		updatedAt: new Date(),
		title: ps.title,
		name: ps.name,
		summary: ps.summary,
		text: ps.text,
		eyeCatchingImageId: eyeCatchingImage ? eyeCatchingImage.id : null,
		userId: user.id,
		visibility: 'public',
		alignCenter: ps.alignCenter,
		hideTitleWhenPinned: ps.hideTitleWhenPinned,
		font: ps.font,
	})).then(x => Pages.findOneByOrFail(x.identifiers[0]));

	return await Pages.pack(page);
});
