import promiseLimit from 'promise-limit';
import { toArray, unique } from '@/prelude/array.js';
import { User } from '@/models/entities/user.js';
import { Resolver } from '@/remote/activitypub/resolver.js';
import { IObject, isMention, IApMention } from '../type.js';
import { resolvePerson } from './person.js';

export async function extractApMentions(tags: IObject | IObject[] | null | undefined, resolver: Resolver): Promise<User[]> {
	const hrefs = unique(extractApMentionObjects(tags).map(x => x.href as string));

	const limit = promiseLimit<User | null>(2);
	const mentionedUsers = (await Promise.all(
		hrefs.map(x => limit(() => resolvePerson(x, resolver).catch(() => null))),
	)).filter((x): x is User => x != null);

	return mentionedUsers;
}

export function extractApMentionObjects(tags: IObject | IObject[] | null | undefined): IApMention[] {
	if (tags == null) return [];
	return toArray(tags).filter(isMention);
}
