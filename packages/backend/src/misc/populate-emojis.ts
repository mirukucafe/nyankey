import { In, IsNull } from 'typeorm';
import config from '@/config/index.js';
import { Emojis } from '@/models/index.js';
import { Emoji } from '@/models/entities/emoji.js';
import { Note } from '@/models/entities/note.js';
import { query } from '@/prelude/url.js';
import { HOUR } from '@/const.js';
import { Cache } from './cache.js';
import { isSelfHost, toPunyNullable } from './convert-host.js';
import { decodeReaction } from './reaction-lib.js';

/**
 * composite cache key: `${host ?? ''}:${name}`
 */
const cache = new Cache<Emoji | null>(
	12 * HOUR,
	async (key) => {
		const [host, name] = key.split(':');
		return (await Emojis.findOneBy({
			name,
			host: host || IsNull(),
		})) || null;
	},
);

/**
 * Information needed to attach in ActivityPub
 */
type PopulatedEmoji = {
	name: string;
	url: string;
};

function normalizeHost(src: string | undefined, noteUserHost: string | null): string | null {
	// クエリに使うホスト
	let host = src === '.' ? null	// .はローカルホスト (ここがマッチするのはリアクションのみ)
		: src === undefined ? noteUserHost	// ノートなどでホスト省略表記の場合はローカルホスト (ここがリアクションにマッチすることはない)
		: isSelfHost(src) ? null	// 自ホスト指定
		: (src || noteUserHost);	// 指定されたホスト || ノートなどの所有者のホスト (こっちがリアクションにマッチすることはない)

	host = toPunyNullable(host);

	return host;
}

function parseEmojiStr(emojiName: string, noteUserHost: string | null) {
	const match = emojiName.match(/^(\w+)(?:@([\w.-]+))?$/);
	if (!match) return { name: null, host: null };

	const name = match[1];

	const host = toPunyNullable(normalizeHost(match[2], noteUserHost));

	return { name, host };
}

/**
 * Resolve emoji information from ActivityPub attachment.
 * @param emojiName custom emoji names attached to notes, user profiles or in rections. Colons should not be included. Localhost is denote by @. (see also `decodeReaction`)
 * @param noteUserHost host that the content is from, to default to
 * @returns emoji information. `null` means not found.
 */
export async function populateEmoji(emojiName: string, noteUserHost: string | null): Promise<PopulatedEmoji | null> {
	const { name, host } = parseEmojiStr(emojiName, noteUserHost);
	if (name == null) return null;

	const emoji = await cache.fetch(`${host ?? ''}:${name}`);

	if (emoji == null) return null;

	const isLocal = emoji.host == null;
	const emojiUrl = emoji.publicUrl || emoji.originalUrl; // || emoji.originalUrl してるのは後方互換性のため
	const url = isLocal ? emojiUrl : `${config.url}/proxy/${encodeURIComponent((new URL(emojiUrl)).pathname)}?${query({ url: emojiUrl })}`;

	return {
		name: emojiName,
		url,
	};
}

/**
 * Retrieve list of emojis from the cache. Uncached emoji are dropped.
 */
export async function populateEmojis(emojiNames: string[], noteUserHost: string | null): Promise<PopulatedEmoji[]> {
	const emojis = await Promise.all(emojiNames.map(x => populateEmoji(x, noteUserHost)));
	return emojis.filter((x): x is PopulatedEmoji => x != null);
}

export function aggregateNoteEmojis(notes: Note[]) {
	let emojis: { name: string | null; host: string | null; }[] = [];
	for (const note of notes) {
		emojis = emojis.concat(note.emojis
			.map(e => parseEmojiStr(e, note.userHost)));
		if (note.renote) {
			emojis = emojis.concat(note.renote.emojis
				.map(e => parseEmojiStr(e, note.renote!.userHost)));
			if (note.renote.user) {
				emojis = emojis.concat(note.renote.user.emojis
					.map(e => parseEmojiStr(e, note.renote!.userHost)));
			}
		}
		const customReactions = Object.keys(note.reactions).map(x => decodeReaction(x)).filter(x => x.name != null) as typeof emojis;
		emojis = emojis.concat(customReactions);
		if (note.user) {
			emojis = emojis.concat(note.user.emojis
				.map(e => parseEmojiStr(e, note.userHost)));
		}
	}
	return emojis.filter(x => x.name != null) as { name: string; host: string | null; }[];
}

/**
 * Query list of emojis in bulk and add them to the cache.
 */
export async function prefetchEmojis(emojis: { name: string; host: string | null; }[]): Promise<void> {
	const notCachedEmojis = emojis.filter(emoji => {
		// check if the cache has this emoji
		return cache.get(`${emoji.host ?? ''}:${emoji.name}`) == null;
	});

	// check if there even are any uncached emoji to handle
	if (notCachedEmojis.length === 0) return;

	// query all uncached emoji
	const emojisQuery: any[] = [];
	// group by hosts to try to reduce query size
	const hosts = new Set(notCachedEmojis.map(e => e.host));
	for (const host of hosts) {
		emojisQuery.push({
			name: In(notCachedEmojis.filter(e => e.host === host).map(e => e.name)),
			host: host ?? IsNull(),
		});
	}

	await Emojis.find({
		where: emojisQuery,
		select: ['name', 'host', 'originalUrl', 'publicUrl'],
	}).then(emojis => {
		// store all emojis into the cache
		emojis.forEach(emoji => {
			cache.set(`${emoji.host ?? ''}:${emoji.name}`, emoji);
		});
	});
}
