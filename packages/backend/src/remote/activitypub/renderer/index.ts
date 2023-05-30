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
				xsd: 'http://www.w3.org/2001/XMLSchema#',
				// as non-standards
				manuallyApprovesFollowers: {
					'@id': 'as:manuallyApprovesFollowers',
					'@type': 'xsd:boolean',
				},
				sensitive: {
					'@id': 'as:sensitive',
					'@type': 'xsd:boolean',
				},
				Hashtag: 'as:Hashtag',
				// Mastodon
				toot: 'http://joinmastodon.org/ns#',
				Emoji: 'toot:Emoji',
				featured: {
					'@id': 'toot:featured',
					'@type': '@id',
				},
				discoverable: {
					'@id': 'toot:discoverable',
					'@type': 'xsd:boolean',
				},
				// Fedibird
				quoteUri: {
					'@id': 'http://fedibird.com/ns#quoteUri',
					'@type': '@id',
				},
				// schema
				schema: 'http://schema.org/',
				PropertyValue: {
					'@id': 'schema:PropertyValue',
					'@context': {
						'value': 'schema:value',
						'name': 'schema:name',
					},
				},
				// Misskey
				misskey: 'https://misskey-hub.net/ns#',
				'_misskey_quote': {
					'@id': 'misskey:_misskey_quote',
					'@type': '@id',
				},
				'_misskey_talk': {
					'@id': 'misskey:_misskey_talk',
					'@type': 'xsd:boolean',
				},
				'isCat': {
					'@id': 'misskey:isCat',
					'@type': 'xsd:boolean',
				},
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
