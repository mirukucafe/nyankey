import { Hashtags } from '@/models/index.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Hashtag',
	},

	errors: ['NO_SUCH_HASHTAG'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		tag: { type: 'string' },
	},
	required: ['tag'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	const hashtag = await Hashtags.findOneBy({ name: normalizeForSearch(ps.tag) });
	if (hashtag == null) throw new ApiError('NO_SUCH_HASHTAG');

	return await Hashtags.pack(hashtag);
});
