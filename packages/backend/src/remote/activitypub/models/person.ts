import promiseLimit from 'promise-limit';
import { Not, IsNull } from 'typeorm';

import config from '@/config/index.js';
import { registerOrFetchInstanceDoc } from '@/services/register-or-fetch-instance-doc.js';
import { Note } from '@/models/entities/note.js';
import { updateUsertags } from '@/services/update-hashtag.js';
import { Users, Instances, Followings, UserProfiles, UserPublickeys } from '@/models/index.js';
import { User, IRemoteUser, CacheableUser } from '@/models/entities/user.js';
import { Emoji } from '@/models/entities/emoji.js';
import { UserNotePining } from '@/models/entities/user-note-pining.js';
import { genId } from '@/misc/gen-id.js';
import { instanceChart, usersChart } from '@/services/chart/index.js';
import { UserPublickey } from '@/models/entities/user-publickey.js';
import { isDuplicateKeyValueError } from '@/misc/is-duplicate-key-value-error.js';
import { extractDbHost } from '@/misc/convert-host.js';
import { UserProfile } from '@/models/entities/user-profile.js';
import { toArray } from '@/prelude/array.js';
import { fetchInstanceMetadata } from '@/services/fetch-instance-metadata.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { truncate } from '@/misc/truncate.js';
import { StatusError } from '@/misc/fetch.js';
import { uriPersonCache } from '@/services/user-cache.js';
import { publishInternalEvent } from '@/services/stream.js';
import { db } from '@/db/postgre.js';
import { fromHtml } from '@/mfm/from-html.js';
import { Resolver } from '@/remote/activitypub/resolver.js';
import { apLogger } from '../logger.js';
import { isCollectionOrOrderedCollection, isCollection, IActor, getApId, getOneApHrefNullable, IObject, isPropertyValue, getApType, isActor } from '../type.js';
import { extractApHashtags } from './tag.js';
import { resolveNote, extractEmojis } from './note.js';
import { resolveImage } from './image.js';

const nameLength = 128;
const summaryLength = 2048;

/**
 * Validate and convert to actor object
 * @param x Fetched object
 * @param uri Fetch target URI
 */
function validateActor(x: IObject): IActor {
	if (x == null) {
		throw new Error('invalid Actor: object is null');
	}

	if (!isActor(x)) {
		throw new Error(`invalid Actor type '${x.type}'`);
	}

	const uri = getApId(x);
	if (uri == null) {
		// Only transient objects or anonymous objects may not have an id or an id that is explicitly null.
		// We consider all actors as not transient and not anonymous so require ids for them.
		throw new Error('invalid Actor: wrong id');
	}

	// This check is security critical.
	// Without this check, an entry could be inserted into UserPublickey for a local user.
	if (extractDbHost(uri) === extractDbHost(config.url)) {
		throw new StatusError('cannot resolve local user', 400, 'cannot resolve local user');
	}

	if (!(typeof x.inbox === 'string' && x.inbox.length > 0)) {
		throw new Error('invalid Actor: wrong inbox');
	}

	if (!(typeof x.preferredUsername === 'string' && x.preferredUsername.length > 0 && x.preferredUsername.length <= 128 && /^\w([\w-.]*\w)?$/.test(x.preferredUsername))) {
		throw new Error('invalid Actor: wrong username');
	}

	// These fields are only informational, and some AP software allows these
	// fields to be very long. If they are too long, we cut them off. This way
	// we can at least see these users and their activities.
	if (x.name) {
		if (!(typeof x.name === 'string' && x.name.length > 0)) {
			throw new Error('invalid Actor: wrong name');
		}
		x.name = truncate(x.name, nameLength);
	}
	if (x.summary) {
		if (!(typeof x.summary === 'string' && x.summary.length > 0)) {
			throw new Error('invalid Actor: wrong summary');
		}
		x.summary = truncate(x.summary, summaryLength);
	}

	if (x.publicKey) {
		if (typeof x.publicKey.id !== 'string') {
			throw new Error('invalid Actor: publicKey.id is not a string');
		}

		// This is a security critical check to not insert or change an entry of
		// UserPublickey to point to a local key id.
		if (extractDbHost(uri) !== extractDbHost(x.publicKey.id)) {
			throw new Error('invalid Actor: publicKey.id has different host');
		}
	}

	return x;
}

/**
 * Fetches a person.
 *
 * If the target Person is registered in FoundKey, it is returned.
 */
export async function fetchPerson(uri: string): Promise<CacheableUser | null> {
	if (typeof uri !== 'string') throw new Error('uri is not string');

	const cached = uriPersonCache.get(uri);
	if (cached) return cached;

	// If the URI points to this server, fetch from database.
	if (uri.startsWith(config.url + '/')) {
		const id = uri.split('/').pop();
		const u = await Users.findOneBy({ id });
		if (u) uriPersonCache.set(uri, u);
		return u;
	}

	//#region このサーバーに既に登録されていたらそれを返す
	const exist = await Users.findOneBy({ uri });

	if (exist) {
		uriPersonCache.set(uri, exist);
		return exist;
	}
	//#endregion

	return null;
}

/**
 * Personを作成します。
 */
export async function createPerson(value: string | IObject, resolver: Resolver): Promise<User> {
	const object = await resolver.resolve(value) as any;

	const person = validateActor(object);

	apLogger.info(`Creating the Person: ${person.id}`);

	const host = extractDbHost(object.id);

	const { fields } = analyzeAttachments(person.attachment || []);

	const tags = extractApHashtags(person.tag).map(tag => normalizeForSearch(tag)).splice(0, 32);

	const isBot = getApType(object) === 'Service';

	const bday = person['vcard:bday']?.match(/^\d{4}-\d{2}-\d{2}/);

	// Create user
	let user: IRemoteUser;
	try {
		// Start transaction
		await db.transaction(async transactionalEntityManager => {
			user = await transactionalEntityManager.save(new User({
				id: genId(),
				avatarId: null,
				bannerId: null,
				createdAt: new Date(),
				lastFetchedAt: new Date(),
				name: truncate(person.name, nameLength),
				isLocked: !!person.manuallyApprovesFollowers,
				isExplorable: !!person.discoverable,
				username: person.preferredUsername,
				usernameLower: person.preferredUsername!.toLowerCase(),
				host,
				inbox: person.inbox,
				sharedInbox: person.sharedInbox || (person.endpoints ? person.endpoints.sharedInbox : undefined),
				followersUri: person.followers ? getApId(person.followers) : undefined,
				featured: person.featured ? getApId(person.featured) : undefined,
				uri: person.id,
				tags,
				isBot,
				isCat: (person as any).isCat === true,
				showTimelineReplies: false,
			})) as IRemoteUser;

			await transactionalEntityManager.save(new UserProfile({
				userId: user.id,
				description: person.summary ? fromHtml(truncate(person.summary, summaryLength)) : null,
				url: getOneApHrefNullable(person.url),
				fields,
				birthday: bday ? bday[0] : null,
				location: person['vcard:Address'] || null,
				userHost: host,
			}));

			if (person.publicKey) {
				await transactionalEntityManager.save(new UserPublickey({
					userId: user.id,
					keyId: person.publicKey.id,
					keyPem: person.publicKey.publicKeyPem,
				}));
			}
		});
	} catch (e) {
		// duplicate key error
		if (isDuplicateKeyValueError(e)) {
			// /users/@a => /users/:id のように入力がaliasなときにエラーになることがあるのを対応
			const u = await Users.findOneBy({
				uri: person.id,
			});

			if (u) {
				user = u as IRemoteUser;
			} else {
				throw new Error('already registered');
			}
		} else {
			apLogger.error(e instanceof Error ? e : new Error(e as string));
			throw e;
		}
	}

	// Register host
	registerOrFetchInstanceDoc(host).then(i => {
		Instances.increment({ id: i.id }, 'usersCount', 1);
		instanceChart.newUser(i.host);
		fetchInstanceMetadata(i);
	});

	usersChart.update(user!, true);

	// ハッシュタグ更新
	updateUsertags(user!, tags);

	//#region アバターとヘッダー画像をフェッチ
	const [avatar, banner] = await Promise.all([
		person.icon,
		person.image,
	].map(img =>
		img == null
			? Promise.resolve(null)
			: resolveImage(user!, img, resolver).catch(() => null),
	));

	const avatarId = avatar ? avatar.id : null;
	const bannerId = banner ? banner.id : null;

	await Users.update(user!.id, {
		avatarId,
		bannerId,
	});

	user!.avatarId = avatarId;
	user!.bannerId = bannerId;
	//#endregion

	//#region カスタム絵文字取得
	const emojis = await extractEmojis(person.tag || [], host).catch(e => {
		apLogger.info(`extractEmojis: ${e}`);
		return [] as Emoji[];
	});

	const emojiNames = emojis.map(emoji => emoji.name);

	await Users.update(user!.id, {
		emojis: emojiNames,
	});
	//#endregion

	await updateFeatured(user!.id, resolver).catch(err => apLogger.error(err));

	return user!;
}

/**
 * Update Person information.
 * If the target Person is not registered in FoundKey, it is ignored.
 * @param value URI of Person or Person itself
 * @param resolver Resolver
 * @param hint Hint of Person object (If this value is a valid Person, it is used for updating without Remote resolve.)
 */
export async function updatePerson(value: IObject | string, resolver: Resolver): Promise<void> {
	const uri = getApId(value);

	// do we already know this user?
	const exist = await Users.findOneBy({ uri, host: Not(IsNull()) }) as IRemoteUser;

	if (exist == null) {
		return;
	}

	const object = await resolver.resolve(value);

	const person = validateActor(object);

	apLogger.info(`Updating the Person: ${person.id}`);

	// Fetch avatar and banner image
	const [avatar, banner] = await Promise.all([
		person.icon,
		person.image,
	].map(img =>
		img == null
			? Promise.resolve(null)
			: resolveImage(exist, img, resolver).catch(() => null),
	));

	// Get custom emoji
	const emojis = await extractEmojis(person.tag || [], exist.host).catch(e => {
		apLogger.info(`extractEmojis: ${e}`);
		return [] as Emoji[];
	});

	const emojiNames = emojis.map(emoji => emoji.name);

	const { fields } = analyzeAttachments(person.attachment ?? []);

	const tags = extractApHashtags(person.tag).map(tag => normalizeForSearch(tag)).splice(0, 32);

	const bday = person['vcard:bday']?.match(/^\d{4}-\d{2}-\d{2}/);

	const updates = {
		lastFetchedAt: new Date(),
		inbox: person.inbox,
		sharedInbox: person.sharedInbox ?? (person.endpoints ? person.endpoints.sharedInbox : undefined),
		followersUri: person.followers ? getApId(person.followers) : undefined,
		featured: person.featured,
		emojis: emojiNames,
		name: truncate(person.name, nameLength),
		tags,
		isBot: getApType(object) === 'Service',
		isCat: (person as any).isCat === true,
		isLocked: !!person.manuallyApprovesFollowers,
		isExplorable: !!person.discoverable,
	} as Partial<User>;

	if (avatar) {
		updates.avatarId = avatar.id;
	}

	if (banner) {
		updates.bannerId = banner.id;
	}

	// Update user
	await Users.update(exist.id, updates);

	if (person.publicKey) {
		await UserPublickeys.update({ userId: exist.id }, {
			keyId: person.publicKey.id,
			keyPem: person.publicKey.publicKeyPem,
		});
	}

	await UserProfiles.update({ userId: exist.id }, {
		url: getOneApHrefNullable(person.url),
		fields,
		description: person.summary ? fromHtml(truncate(person.summary, summaryLength)) : null,
		birthday: bday ? bday[0] : null,
		location: person['vcard:Address'] || null,
	});

	publishInternalEvent('remoteUserUpdated', { id: exist.id });

	updateUsertags(exist, tags);

	// If the user in question is already a follower, followers will also be updated.
	await Followings.update({
		followerId: exist.id,
	}, {
		followerSharedInbox: person.sharedInbox ?? (person.endpoints ? person.endpoints.sharedInbox : undefined),
	});

	await updateFeatured(exist.id, resolver).catch(err => apLogger.error(err));
}

/**
 * Resolve Person.
 *
 * If the target Person is registered in FoundKey, return it; otherwise, fetch it from a remote server and return it.
 * Fetch the person from the remote server, register it in FoundKey, and return it.
 */
export async function resolvePerson(uri: string, resolver: Resolver): Promise<CacheableUser> {
	if (typeof uri !== 'string') throw new Error('uri is not string');

	//#region このサーバーに既に登録されていたらそれを返す
	const exist = await fetchPerson(uri);

	if (exist) {
		return exist;
	}
	//#endregion

	// リモートサーバーからフェッチしてきて登録
	return await createPerson(uri, resolver);
}

export function analyzeAttachments(attachments: IObject | IObject[] | undefined) {
	const fields: {
		name: string,
		value: string
	}[] = [];
	const services: { [x: string]: any } = {};

	if (Array.isArray(attachments)) {
		for (const attachment of attachments.filter(isPropertyValue)) {
			fields.push({
				name: attachment.name,
				value: fromHtml(attachment.value),
			});
		}
	}

	return { fields, services };
}

async function updateFeatured(userId: User['id'], resolver: Resolver) {
	const user = await Users.findOneByOrFail({ id: userId });
	if (!Users.isRemoteUser(user)) return;
	if (!user.featured) return;

	apLogger.info(`Updating the featured: ${user.uri}`);

	// Resolve to (Ordered)Collection Object
	const collection = await resolver.resolveCollection(user.featured);
	if (!isCollectionOrOrderedCollection(collection)) throw new Error('Object is not Collection or OrderedCollection');

	// Resolve to Object(may be Note) arrays
	const unresolvedItems = isCollection(collection) ? collection.items : collection.orderedItems;
	const items = await Promise.all(toArray(unresolvedItems).map(x => resolver.resolve(x)));

	// Resolve and regist Notes
	const limit = promiseLimit<Note | null>(2);
	const featuredNotes = await Promise.all(items
		.filter(item => getApType(item) === 'Note')	// TODO: Noteでなくてもいいかも
		.slice(0, 5)
		.map(item => limit(() => resolveNote(item, resolver))));

	await db.transaction(async transactionalEntityManager => {
		await transactionalEntityManager.delete(UserNotePining, { userId: user.id });

		// とりあえずidを別の時間で生成して順番を維持
		let td = 0;
		for (const note of featuredNotes.filter(note => note != null)) {
			td -= 1000;
			transactionalEntityManager.insert(UserNotePining, {
				id: genId(new Date(Date.now() + td)),
				createdAt: new Date(),
				userId: user.id,
				noteId: note!.id,
			});
		}
	});
}
