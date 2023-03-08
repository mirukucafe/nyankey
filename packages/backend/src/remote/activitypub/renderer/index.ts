import { v4 as uuid } from 'uuid';
import config from '@/config/index.js';
import { getUserKeypair } from '@/misc/keypair-store.js';
import { User } from '@/models/entities/user.js';
import { IActivity } from '../type.js';
import { LdSignature } from '../misc/ld-signature.js';

export const renderActivity = (x: any): IActivity | null => {
	if (x == null) return null;

	if (typeof x === 'object' && x.id == null) {
		x.id = `${config.url}/${uuid()}`;
	}

	return Object.assign({
		'@context': [
			'https://www.w3.org/ns/activitystreams',
			'https://w3id.org/security/v1',
			{
				// as non-standards
				manuallyApprovesFollowers: 'as:manuallyApprovesFollowers',
				sensitive: 'as:sensitive',
				Hashtag: 'as:Hashtag',
				// Mastodon
				toot: 'http://joinmastodon.org/ns#',
				Emoji: 'toot:Emoji',
				featured: 'toot:featured',
				discoverable: 'toot:discoverable',
				// Fedibird
				fedibird: 'http://fedibird.com/ns#',
				quoteUri: 'fedibird:quoteUri',
				// schema
				schema: 'http://schema.org#',
				PropertyValue: 'schema:PropertyValue',
				value: 'schema:value',
				// Misskey
				misskey: 'https://misskey-hub.net/ns#',
				'_misskey_quote': 'misskey:_misskey_quote',
				'_misskey_talk': 'misskey:_misskey_talk',
				'isCat': 'misskey:isCat',
				// vcard
				vcard: 'http://www.w3.org/2006/vcard/ns#',
			},
		],
	}, x);
};

export const attachLdSignature = async (activity: any, user: { id: User['id']; host: null; }): Promise<IActivity | null> => {
	if (activity == null) return null;

	const keypair = await getUserKeypair(user.id);

	const ldSignature = new LdSignature();
	ldSignature.debug = false;
	return await ldSignature.signRsaSignature2017(activity, keypair.privateKey, `${config.url}/users/${user.id}#main-key`);
};
