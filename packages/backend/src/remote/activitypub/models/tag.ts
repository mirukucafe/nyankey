import { toArray } from '@/prelude/array.js';
import { IObject, isHashtag, IApHashtag, isLink, ILink } from '../type.js';

export function extractApHashtags(tags: IObject | IObject[] | null | undefined) {
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
