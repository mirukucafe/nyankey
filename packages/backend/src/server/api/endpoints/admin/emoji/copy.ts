import { Emojis } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { DriveFile } from '@/models/entities/drive-file.js';
import { uploadFromUrl } from '@/services/drive/upload-from-url.js';
import { publishBroadcastStream } from '@/services/stream.js';
import { db } from '@/db/postgre.js';
import define from '@/server/api/define.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	errors: ['NO_SUCH_EMOJI', 'INTERNAL_ERROR'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		emojiId: { type: 'string', format: 'misskey:id' },
	},
	required: ['emojiId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	const emoji = await Emojis.findOneBy({ id: ps.emojiId });

	if (emoji == null) throw new ApiError('NO_SUCH_EMOJI');

	let driveFile: DriveFile;

	try {
		// Create file
		driveFile = await uploadFromUrl({ url: emoji.originalUrl, user: null, force: true });
	} catch (e) {
		throw new ApiError('INTERNAL_ERROR', e);
	}

	const copied = await Emojis.insert({
		id: genId(),
		updatedAt: new Date(),
		name: emoji.name,
		host: null,
		aliases: [],
		originalUrl: driveFile.url,
		publicUrl: driveFile.webpublicUrl ?? driveFile.url,
		type: driveFile.webpublicType ?? driveFile.type,
	}).then(x => Emojis.findOneByOrFail(x.identifiers[0]));

	await db.queryResultCache!.remove(['meta_emojis']);

	publishBroadcastStream('emojiAdded', {
		emoji: await Emojis.pack(copied.id),
	});

	return {
		id: copied.id,
	};
});
