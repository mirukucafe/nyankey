import { In } from 'typeorm';
import { Emojis } from '@/models/index.js';
import { insertModerationLog } from '@/services/insert-moderation-log.js';
import { db } from '@/db/postgre.js';
import define from '@/server/api/define.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		ids: { type: 'array', items: {
			type: 'string', format: 'misskey:id',
		} },
	},
	required: ['ids'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const emojis = await Emojis.findBy({
		id: In(ps.ids),
	});

	for (const emoji of emojis) {
		await Emojis.delete(emoji.id);
	
		await db.queryResultCache!.remove(['meta_emojis']);
	
		insertModerationLog(me, 'deleteEmoji', { emoji });
	}
});
