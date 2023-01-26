import { URLSearchParams } from 'node:url';
import fetch from 'node-fetch';
import config from '@/config/index.js';
import { getAgentByUrl } from '@/misc/fetch.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { TranslationService } from '@/models/entities/meta.js';
import { ApiError } from '../../error.js';
import { getNote } from '../../common/getters.js';
import define from '../../define.js';

const sourceLangs = [
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
];

export const meta = {
	tags: ['notes'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			sourceLang: {
				type: 'string',
				enum: sourceLangs,
			},
			text: { type: 'string' },
		},
	},

	v2: {
		method: 'get',
		alias: 'notes/:noteId/translate/:targetLang',
		pathParameters: ['noteId', 'targetLang'],
	},

	errors: ['NO_SUCH_NOTE'],
} as const;

// List of permitted languages from https://www.deepl.com/docs-api/translate-text/translate-text/
export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		sourceLang: { 
			type: 'string',
			enum: sourceLangs,
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
		if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError('NO_SUCH_NOTE');
		throw err;
	});
	const instance = await fetchMeta();

	if (instance.translationService == null) {
		return 204;
	}

	type Translation = {
		sourceLang: string;
		text: string;
	};

	async function translateDeepL(): Promise<Translation | number> {
		if (note.text == null || instance.deeplAuthKey == null) {
			return 204; // TODO: Return a better error
		}

		const sourceLang = ps.sourceLang;
		const targetLang = ps.targetLang;

		const params = new URLSearchParams();
		params.append('auth_key', instance.deeplAuthKey);
		params.append('text', note.text);
		params.append('target_lang', targetLang);
		if (sourceLang) params.append('source_lang', sourceLang);

		// From the DeepL API docs:
		//> DeepL API Free authentication keys can be identified easily by the suffix ":fx"
		const endpoint = instance.deeplAuthKey.endsWith(':fx')
			? 'https://api-free.deepl.com/v2/translate'
			: 'https://api.deepl.com/v2/translate';

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
	}
	
	async function translateLibreTranslate(): Promise<Translation | number> {
		if (note.text == null || instance.libreTranslateEndpoint == null) {
			return 204;
		}

		// LibteTranslate only understands 2-letter codes
		const source = ps.sourceLang?.toLowerCase().split('-', 1)[0] ?? 'auto';
		const target = ps.targetLang.toLowerCase().split('-', 1)[0];
		const api_key = instance.libreTranslateAuthKey ?? undefined;
		const endpoint = instance.libreTranslateEndpoint;

		const params = {
			q: note.text,
			source,
			target,
			api_key,
		};

		const res = await fetch(endpoint, {
			method: 'POST',
			body: JSON.stringify(params),
			headers: { 'Content-Type': 'application/json' },
		});

		const json = (await res.json()) as {
			detectedLanguage?: {
				confidence: number;
				language: string;
			};
			translatedText: string;
		};

		return {
			sourceLang: (json.detectedLanguage?.language ?? source).toUpperCase(),
			text: json.translatedText,
		};
	}

	switch (instance.translationService) {
		case TranslationService.DeepL:
			return await translateDeepL();
		case TranslationService.LibreTranslate:
			return await translateLibreTranslate();
	}
});
