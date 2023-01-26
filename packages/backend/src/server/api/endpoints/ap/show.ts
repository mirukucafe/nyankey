import { createPerson } from '@/remote/activitypub/models/person.js';
import { createNote } from '@/remote/activitypub/models/note.js';
import { DbResolver } from '@/remote/activitypub/db-resolver.js';
import { Resolver } from '@/remote/activitypub/resolver.js';
import { extractDbHost } from '@/misc/convert-host.js';
import { Users, Notes } from '@/models/index.js';
import { Note } from '@/models/entities/note.js';
import { CacheableLocalUser, User } from '@/models/entities/user.js';
import { isActor, isPost } from '@/remote/activitypub/type.js';
import { SchemaType } from '@/misc/schema.js';
import { HOUR } from '@/const.js';
import { shouldBlockInstance } from '@/misc/should-block-instance.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['federation'],

	requireCredential: true,

	description: 'Shows the requested object. If necessary, fetches the object from the remote server.',

	limit: {
		duration: HOUR,
		max: 30,
	},

	errors: ['NO_SUCH_OBJECT'],

	res: {
		optional: false, nullable: false,
		oneOf: [
			{
				type: 'object',
				properties: {
					type: {
						type: 'string',
						optional: false, nullable: false,
						enum: ['User'],
					},
					object: {
						type: 'object',
						optional: false, nullable: false,
						ref: 'UserDetailedNotMe',
					},
				},
			},
			{
				type: 'object',
				properties: {
					type: {
						type: 'string',
						optional: false, nullable: false,
						enum: ['Note'],
					},
					object: {
						type: 'object',
						optional: false, nullable: false,
						ref: 'Note',
					},
				},
			},
		],
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		uri: { type: 'string' },
	},
	required: ['uri'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const object = await fetchAny(ps.uri, me);
	if (object) {
		return object;
	} else {
		throw new ApiError('NO_SUCH_OBJECT');
	}
});

/***
 * URIからUserかNoteを解決する
 */
async function fetchAny(uri: string, me: CacheableLocalUser | null | undefined): Promise<SchemaType<typeof meta['res']> | null> {
	// Stop if the host is blocked.
	const host = extractDbHost(uri);
	if (await shouldBlockInstance(host)) {
		return null;
	}

	const dbResolver = new DbResolver();

	let local = await mergePack(me, ...await Promise.all([
		dbResolver.getUserFromApId(uri),
		dbResolver.getNoteFromApId(uri),
	]));
	if (local != null) return local;

	// fetch object from remote
	const resolver = new Resolver();
	// allow redirect
	const object = await resolver.resolve(uri, true) as any;

	// /@user のような正規id以外で取得できるURIが指定されていた場合、ここで初めて正規URIが確定する
	// これはDBに存在する可能性があるため再度DB検索
	if (uri !== object.id) {
		local = await mergePack(me, ...await Promise.all([
			dbResolver.getUserFromApId(object.id),
			dbResolver.getNoteFromApId(object.id),
		]));
		if (local != null) return local;
	}

	return await mergePack(
		me,
		isActor(object) ? await createPerson(object, resolver) : null,
		isPost(object) ? await createNote(object, resolver, true) : null,
	);
}

async function mergePack(me: CacheableLocalUser | null | undefined, user: User | null | undefined, note: Note | null | undefined): Promise<SchemaType<typeof meta.res> | null> {
	if (user != null) {
		return {
			type: 'User',
			object: await Users.pack(user, me, { detail: true }),
		};
	} else if (note != null) {
		try {
			const object = await Notes.pack(note, me, { detail: true });

			return {
				type: 'Note',
				object,
			};
		} catch (e) {
			return null;
		}
	}

	return null;
}
