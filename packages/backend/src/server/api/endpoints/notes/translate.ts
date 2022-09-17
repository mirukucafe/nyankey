import { URLSearchParams } from 'node:url';
import fetch from 'node-fetch';
import config from '@/config/index.js';
import { getAgentByUrl } from '@/misc/fetch.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { Notes } from '@/models/index.js';
import { ApiError } from '../../error.js';
import { getNote } from '../../common/getters.js';
import define from '../../define.js';

export const meta = {
	tags: ['notes'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'bea9b03f-36e0-49c5-a4db-627a029f8971',
		},
	},
} as const;

// List of permitted languages from https://www.deepl.com/docs-api/translate-text/translate-text/
export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		sourceLang: { 
			type: 'string',
			enum: [
				'BG',
				'CS',
				'DA',
				'DE',
				'EL',
				'EN',
				'ES',
				'ET',
				'FI',
				'FR',
				'HU',
				'ID',
				'IT',
				'JA',
				'LT',
				'LV',
				'NL',
				'PL',
				'PT',
				'RO',
				'RU',
				'SK',
				'SL',
				'SV',
				'TR',
				'UK',
				'ZH',
			],
		},
		targetLang: {
			type: 'string',
			enum: [
				'BG',
				'CS',
				'DA',
				'DE',
				'EL',
				'EN',
				'EN-GB',
				'EN-US',
				'ES',
				'ET',
				'FI',
				'FR',
				'HU',
				'ID',
				'IT',
				'JA',
				'LT',
				'LV',
				'NL',
				'PL',
				'PT',
				'PT-BR',
				'PT-PT',
				'RO',
				'RU',
				'SK',
				'SL',
				'SV',
				'TR',
				'UK',
				'ZH',
			],
		},
	},
	required: ['noteId', 'targetLang'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const note = await getNote(ps.noteId, user).catch(err => {
		if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw err;
	});

	if (note.text == null) {
		return 204;
	}

	const instance = await fetchMeta();

	if (instance.deeplAuthKey == null) {
		return 204; // TODO: 良い感じのエラー返す
	}

	const sourceLang = ps.sourceLang;
	const targetLang = ps.targetLang;

	const params = new URLSearchParams();
	params.append('auth_key', instance.deeplAuthKey);
	params.append('text', note.text);
	params.append('target_lang', targetLang);
	if (sourceLang) params.append('source_lang', sourceLang);

	const endpoint = instance.deeplIsPro ? 'https://api.deepl.com/v2/translate' : 'https://api-free.deepl.com/v2/translate';

	const res = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': config.userAgent,
			Accept: 'application/json, */*',
		},
		body: params,
		// TODO
		//timeout: 10000,
		agent: getAgentByUrl,
	});

	const json = (await res.json()) as {
		translations: {
			detected_source_language: string;
			text: string;
		}[];
	};

	return {
		sourceLang: json.translations[0].detected_source_language,
		text: json.translations[0].text,
	};
});
