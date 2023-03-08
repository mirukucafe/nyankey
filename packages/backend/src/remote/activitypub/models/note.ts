import promiseLimit from 'promise-limit';

import config from '@/config/index.js';
import post from '@/services/note/create.js';
import { CacheableRemoteUser } from '@/models/entities/user.js';
import { unique, toArray, toSingle } from '@/prelude/array.js';
import { vote } from '@/services/note/polls/vote.js';
import { DriveFile } from '@/models/entities/drive-file.js';
import { deliverQuestionUpdate } from '@/services/note/polls/update.js';
import { extractDbHost, toPuny } from '@/misc/convert-host.js';
import { Emojis, Polls, MessagingMessages } from '@/models/index.js';
import { Note } from '@/models/entities/note.js';
import { Emoji } from '@/models/entities/emoji.js';
import { genId } from '@/misc/gen-id.js';
import { getApLock } from '@/misc/app-lock.js';
import { createMessage } from '@/services/messages/create.js';
import { StatusError } from '@/misc/fetch.js';
import { fromHtml } from '@/mfm/from-html.js';
import { shouldBlockInstance } from '@/misc/should-block-instance.js';
import { Resolver } from '@/remote/activitypub/resolver.js';
import { parseAudience } from '../audience.js';
import { IObject, getOneApId, getApId, getOneApHrefNullable, validPost, IPost, isEmoji, getApType } from '../type.js';
import { DbResolver } from '../db-resolver.js';
import { apLogger } from '../logger.js';
import { resolvePerson } from './person.js';
import { resolveImage } from './image.js';
import { extractApHashtags, extractQuoteUrl } from './tag.js';
import { extractPollFromQuestion } from './question.js';
import { extractApMentions } from './mention.js';

export function validateNote(object: IObject): Error | null {
	if (object == null) {
		return new Error('invalid Note: object is null');
	}

	if (!validPost.includes(getApType(object))) {
		return new Error(`invalid Note: invalid object type ${getApType(object)}`);
	}

	const id = getApId(object);
	if (id == null) {
		// Only transient objects or anonymous objects may not have an id or an id that is explicitly null.
		// We consider all Notes as not transient and not anonymous so require ids for them.
		return new Error(`invalid Note: id required but not present`);
	}

	// Check that the server is authorized to act on behalf of this author.
	const expectHost = extractDbHost(id);
	const attributedToHost = object.attributedTo
		? extractDbHost(getOneApId(object.attributedTo))
		: null;
	if (attributedToHost !== expectHost) {
		return new Error(`invalid Note: attributedTo has different host. expected: ${expectHost}, actual: ${attributedToHost}`);
	}

	return null;
}

/**
 * Fetch Note.
 *
 * Returns the target Note if it is registered in FoundKey.
 */
export async function fetchNote(object: string | IObject): Promise<Note | null> {
	const dbResolver = new DbResolver();
	return await dbResolver.getNoteFromApId(object);
}

/**
 * Noteを作成します。
 */
export async function createNote(value: string | IObject, resolver: Resolver, silent = false): Promise<Note | null> {
	const object: IObject = await resolver.resolve(value);

	const err = validateNote(object);
	if (err) {
		apLogger.error(`${err.message}`, {
			resolver: {
				history: resolver.getHistory(),
			},
			value,
			object,
		});
		throw new Error('invalid note');
	}

	const note: IPost = object;

	apLogger.debug(`Note fetched: ${JSON.stringify(note, null, 2)}`);

	apLogger.info(`Creating the Note: ${note.id}`);

	// 投稿者をフェッチ
	const actor = await resolvePerson(getOneApId(note.attributedTo), resolver) as CacheableRemoteUser;

	// 投稿者が凍結されていたらスキップ
	if (actor.isSuspended) {
		throw new Error('actor has been suspended');
	}

	const noteAudience = await parseAudience(actor, note.to, note.cc);
	let visibility = noteAudience.visibility;
	const visibleUsers = noteAudience.visibleUsers;

	// Audience (to, cc) が指定されてなかった場合
	if (visibility === 'specified' && visibleUsers.length === 0) {
		if (typeof value === 'string') {	// 入力がstringならばresolverでGETが発生している
			// こちらから匿名GET出来たものならばpublic
			visibility = 'public';
		}
	}

	let isTalk = note._misskey_talk && visibility === 'specified';

	const apMentions = await extractApMentions(note.tag, resolver);
	const apHashtags = await extractApHashtags(note.tag);

	// 添付ファイル
	// TODO: attachmentは必ずしもImageではない
	// TODO: attachmentは必ずしも配列ではない
	// Noteがsensitiveなら添付もsensitiveにする
	const limit = promiseLimit(2);

	note.attachment = Array.isArray(note.attachment) ? note.attachment : note.attachment ? [note.attachment] : [];
	const files = note.attachment
		.map(attach => attach.sensitive = note.sensitive)
		? (await Promise.all(note.attachment.map(x => limit(() => resolveImage(actor, x, resolver)) as Promise<DriveFile>)))
			.filter(image => image != null)
		: [];

	// リプライ
	const reply: Note | null = note.inReplyTo
		? await resolveNote(note.inReplyTo, resolver).then(x => {
			if (x == null) {
				apLogger.warn('Specified inReplyTo, but nout found');
				throw new Error('inReplyTo not found');
			} else {
				return x;
			}
		}).catch(async e => {
			// トークだったらinReplyToのエラーは無視
			const uri = getApId(note.inReplyTo);
			if (uri.startsWith(config.url + '/')) {
				const id = uri.split('/').pop();
				const talk = await MessagingMessages.countBy({ id });
				if (talk) {
					isTalk = true;
					return null;
				}
			}

			apLogger.warn(`Error in inReplyTo ${note.inReplyTo} - ${e.statusCode || e}`);
			throw e;
		})
		: null;

	let quote: Note | undefined | null;
	const quoteUrl = extractQuoteUrl(note.tag);

	if (quoteUrl || note._misskey_quote || note.quoteUri) {
		const tryResolveNote = async (uri: string): Promise<{
			status: 'ok';
			res: Note | null;
		} | {
			status: 'permerror' | 'temperror';
		}> => {
			if (typeof uri !== 'string' || !uri.match(/^https?:/)) return { status: 'permerror' };
			try {
				const res = await resolveNote(uri, resolver);
				if (res) {
					return {
						status: 'ok',
						res,
					};
				} else {
					return {
						status: 'permerror',
					};
				}
			} catch (e) {
				return {
					status: (e instanceof StatusError && e.isClientError) ? 'permerror' : 'temperror',
				};
			}
		};

		const uris = unique([quoteUrl, note._misskey_quote, note.quoteUri].filter((x): x is string => typeof x === 'string'));
		let temperror = false;
		// check the urls sequentially and abort early to not do unnecessary HTTP requests
		// picks the first one that works
		for (const uri of uris) {
			const res = await tryResolveNote(uri);
			if (res.status === 'ok') {
				quote = res.res;
				break;
			} else if (res.status === 'temperror') {
				temperror = true;
			}
		}
		if (!quote && temperror) {
			// could not resolve quote, try again later
			throw new Error('quote resolve failed');
		}
	}

	const cw = note.summary === '' ? null : note.summary;

	// text parsing
	let text: string | null = null;
	if (note.source?.mediaType === 'text/x.misskeymarkdown' && typeof note.source.content === 'string') {
		text = note.source.content;
	} else if (typeof note.content === 'string') {
		text = fromHtml(note.content, quote?.uri);
	}

	// vote
	if (reply && reply.hasPoll) {
		const poll = await Polls.findOneByOrFail({ noteId: reply.id });

		const tryCreateVote = async (name: string, index: number): Promise<null> => {
			if (poll.expiresAt && Date.now() > new Date(poll.expiresAt).getTime()) {
				apLogger.warn(`vote to expired poll from AP: actor=${actor.username}@${actor.host}, note=${note.id}, choice=${name}`);
			} else if (index >= 0) {
				apLogger.info(`vote from AP: actor=${actor.username}@${actor.host}, note=${note.id}, choice=${name}`);
				await vote(actor, reply, index);

				// リモートフォロワーにUpdate配信
				deliverQuestionUpdate(reply.id);
			}
			return null;
		};

		if (note.name) {
			return await tryCreateVote(note.name, poll.choices.findIndex(x => x === note.name));
		}
	}

	const emojis = await extractEmojis(note.tag || [], actor.host).catch(e => {
		apLogger.info(`extractEmojis: ${e}`);
		return [] as Emoji[];
	});

	const apEmojis = emojis.map(emoji => emoji.name);

	const poll = await extractPollFromQuestion(note, resolver).catch(() => undefined);

	if (isTalk) {
		for (const recipient of visibleUsers) {
			await createMessage(actor, recipient, undefined, text || undefined, (files && files.length > 0) ? files[0] : null, object.id);
			return null;
		}
	}

	return await post(actor, {
		createdAt: note.published ? new Date(note.published) : null,
		files,
		reply,
		renote: quote,
		name: note.name,
		cw,
		text,
		localOnly: false,
		visibility,
		visibleUsers,
		apMentions,
		apHashtags,
		apEmojis,
		poll,
		uri: note.id,
		url: getOneApHrefNullable(note.url),
	}, silent);
}

/**
 * Resolve Note.
 *
 * If the target Note is registered in FoundKey, return it; otherwise, fetch it from a remote server and return it.
 * Fetch the Note from the remote server, register it in FoundKey, and return it.
 */
export async function resolveNote(value: string | IObject, resolver: Resolver): Promise<Note | null> {
	const uri = typeof value === 'string' ? value : value.id;
	if (uri == null) throw new Error('missing uri');

	// Interrupt if blocked.
	if (await shouldBlockInstance(extractDbHost(uri))) throw new StatusError('host blocked', 451, `host ${extractDbHost(uri)} is blocked`);

	const unlock = await getApLock(uri);

	try {
		//#region If already registered on this server, return it.
		const exist = await fetchNote(uri);

		if (exist) {
			return exist;
		}
		//#endregion

		if (uri.startsWith(config.url)) {
			throw new StatusError('cannot resolve local note', 400, 'cannot resolve local note');
		}

		// リモートサーバーからフェッチしてきて登録
		// ここでuriの代わりに添付されてきたNote Objectが指定されていると、サーバーフェッチを経ずにノートが生成されるが
		// 添付されてきたNote Objectは偽装されている可能性があるため、常にuriを指定してサーバーフェッチを行う。
		return await createNote(uri, resolver, true);
	} finally {
		unlock();
	}
}

export async function extractEmojis(tags: IObject | IObject[], idnHost: string): Promise<Emoji[]> {
	const host = toPuny(idnHost);

	if (!tags) return [];

	const eomjiTags = toArray(tags).filter(isEmoji);

	return await Promise.all(eomjiTags.map(async tag => {
		const name = tag.name!.replace(/^:/, '').replace(/:$/, '');
		tag.icon = toSingle(tag.icon);

		const exists = await Emojis.findOneBy({
			host,
			name,
		});

		if (exists) {
			if ((tag.updated != null && exists.updatedAt == null)
				|| (tag.id != null && exists.uri == null)
				|| (tag.updated != null && exists.updatedAt != null && new Date(tag.updated) > exists.updatedAt)
				|| (tag.icon!.url !== exists.originalUrl)
			) {
				await Emojis.update({
					host,
					name,
				}, {
					uri: tag.id,
					originalUrl: tag.icon!.url,
					publicUrl: tag.icon!.url,
					updatedAt: new Date(),
				});

				return await Emojis.findOneBy({
					host,
					name,
				}) as Emoji;
			}

			return exists;
		}

		apLogger.info(`register emoji host=${host}, name=${name}`);

		return await Emojis.insert({
			id: genId(),
			host,
			name,
			uri: tag.id,
			originalUrl: tag.icon!.url,
			publicUrl: tag.icon!.url,
			updatedAt: new Date(),
			aliases: [],
		} as Partial<Emoji>).then(x => Emojis.findOneByOrFail(x.identifiers[0]));
	}));
}
