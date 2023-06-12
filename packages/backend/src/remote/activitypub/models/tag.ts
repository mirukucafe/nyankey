import { toArray, toSingle } from '@/prelude/array.js';
import { IObject, isHashtag, IApHashtag, isLink, ILink, isEmoji } from '../type.js';
import { toPuny } from '@/misc/convert-host.js';
import { Emojis } from '@/models/index.js';
import { Emoji } from '@/models/entities/emoji.js';
import { apLogger } from '@/remote/activitypub/logger.js';
import { genId } from '@/misc/gen-id.js';

export function extractApHashtags(tags: IObject | IObject[] | null | undefined): string[] {
	if (tags == null) return [];

	const hashtags = extractApHashtagObjects(tags);

	return hashtags.map(tag => {
		const m = tag.name.match(/^#(.+)/);
		return m ? m[1] : null;
	}).filter((x): x is string => x != null);
}

export function extractApHashtagObjects(tags: IObject | IObject[] | null | undefined): IApHashtag[] {
	if (tags == null) return [];
	return toArray(tags).filter(isHashtag);
}

// implements FEP-e232: Object Links (2022-12-23 version)
export function extractQuoteUrl(tags: IObject | IObject[] | null | undefined): string | null {
	if (tags == null) return null;

	// filter out correct links
	let quotes: ILink[] = toArray(tags)
		.filter(isLink)
		.filter(link =>
			[
				'application/ld+json; profile="https://www.w3.org/ns/activitystreams"',
				'application/activity+json'
			].includes(link.mediaType?.toLowerCase())
		)
		.filter(link =>
			toArray(link.rel)
				.some(rel =>
					[
						'https://misskey-hub.net/ns#_misskey_quote',
						'http://fedibird.com/ns#quoteUri',
						'https://www.w3.org/ns/activitystreams#quoteUrl',
					].includes(rel)
				)
		)
		// Deduplicate by href.
		.filter((x, i, arr) => arr.findIndex(y => x.href === y.href) === i);

	if (quotes.length === 0) return null;
	// If there is more than one quote, we just pick the first/a random one.
	else return quotes[0].href;
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
