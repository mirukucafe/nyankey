import { DriveFiles } from '@/models/index.js';
import define from '@/server/api/define.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

	description: 'Check if a given file exists.',

	res: {
		type: 'boolean',
		optional: false, nullable: false,
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		md5: { type: 'string' },
	},
	required: ['md5'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	return 0 < await DriveFiles.countBy({
		md5: ps.md5,
		userId: user.id,
	});
});
