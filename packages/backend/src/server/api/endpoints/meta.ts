import { IsNull } from 'typeorm';
import config from '@/config/index.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { Emojis, Users } from '@/models/index.js';
import define from '../define.js';
import { translatorAvailable } from '../common/translator.js';

export const meta = {
	tags: ['meta'],

	requireCredential: false,

	allowGet: true,
	cacheSec: 60,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			maintainerName: {
				type: 'string',
				optional: false, nullable: true,
			},
			maintainerEmail: {
				type: 'string',
				optional: false, nullable: true,
			},
			version: {
				type: 'string',
				optional: false, nullable: false,
				example: config.version,
			},
			name: {
				type: 'string',
				optional: false, nullable: false,
			},
			uri: {
				type: 'string',
				optional: false, nullable: false,
				format: 'url',
				example: 'https://misskey.example.com',
			},
			description: {
				type: 'string',
				optional: false, nullable: true,
			},
			langs: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'string',
					optional: false, nullable: false,
				},
			},
			tosUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			defaultDarkTheme: {
				type: 'string',
				optional: false, nullable: true,
			},
			defaultLightTheme: {
				type: 'string',
				optional: false, nullable: true,
			},
			disableRegistration: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			disableLocalTimeline: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			disableGlobalTimeline: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			driveCapacityPerLocalUserMb: {
				type: 'number',
				optional: false, nullable: false,
			},
			driveCapacityPerRemoteUserMb: {
				type: 'number',
				optional: false, nullable: false,
			},
			cacheRemoteFiles: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			emailRequiredForSignup: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			enableHcaptcha: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			hcaptchaSiteKey: {
				type: 'string',
				optional: false, nullable: true,
			},
			enableRecaptcha: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			recaptchaSiteKey: {
				type: 'string',
				optional: false, nullable: true,
			},
			swPublickey: {
				type: 'string',
				optional: false, nullable: true,
			},
			bannerUrl: {
				type: 'string',
				optional: false, nullable: false,
			},
			iconUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			maxNoteTextLength: {
				type: 'number',
				optional: false, nullable: false,
			},
			emojis: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'object',
					optional: false, nullable: false,
					properties: {
						id: {
							type: 'string',
							optional: false, nullable: false,
							format: 'id',
						},
						aliases: {
							type: 'array',
							optional: false, nullable: false,
							items: {
								type: 'string',
								optional: false, nullable: false,
							},
						},
						category: {
							type: 'string',
							optional: false, nullable: true,
						},
						host: {
							type: 'string',
							optional: false, nullable: true,
							description: 'The local host is represented with `null`.',
						},
						url: {
							type: 'string',
							optional: false, nullable: false,
							format: 'url',
						},
					},
				},
			},
			requireSetup: {
				type: 'boolean',
				optional: false, nullable: false,
				example: false,
			},
			enableEmail: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			translatorAvailable: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			proxyAccountName: {
				type: 'string',
				optional: false, nullable: true,
			},
			images: {
				type: 'object',
				optional: false, nullable: false,
				properties: {
					info: { type: 'string' },
					notFound: { type: 'string' },
					error: { type: 'string' },
				},
			},
			features: {
				type: 'object',
				optional: true, nullable: false,
				properties: {
					registration: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					localTimeLine: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					globalTimeLine: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					elasticsearch: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					hcaptcha: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					recaptcha: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					objectStorage: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					serviceWorker: {
						type: 'boolean',
						optional: true, nullable: false,
						default: true,
					},
					miauth: {
						type: 'boolean',
						optional: true, nullable: false,
						default: true,
					},
				},
			},
		},
	},

	v2: {
		method: 'get',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		detail: {
			deprecated: true,
			description: 'This parameter is ignored. You will always get all details (as if it was `true`).',
			type: 'boolean',
			default: true,
		},
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async () => {
	const instance = await fetchMeta(true);

	const emojis = await Emojis.find({
		where: {
			host: IsNull(),
		},
		order: {
			category: 'ASC',
			name: 'ASC',
		},
		cache: {
			id: 'meta_emojis',
			milliseconds: 3600000,	// 1 hour
		},
	});

	return {
		maintainerName: instance.maintainerName,
		maintainerEmail: instance.maintainerEmail,

		version: config.version,

		name: instance.name,
		uri: config.url,
		description: instance.description,
		langs: instance.langs,
		tosUrl: instance.ToSUrl,
		disableRegistration: instance.disableRegistration,
		disableLocalTimeline: instance.disableLocalTimeline,
		disableGlobalTimeline: instance.disableGlobalTimeline,
		driveCapacityPerLocalUserMb: instance.localDriveCapacityMb,
		driveCapacityPerRemoteUserMb: instance.remoteDriveCapacityMb,
		emailRequiredForSignup: instance.emailRequiredForSignup,
		enableHcaptcha: instance.enableHcaptcha,
		hcaptchaSiteKey: instance.hcaptchaSiteKey,
		enableRecaptcha: instance.enableRecaptcha,
		recaptchaSiteKey: instance.recaptchaSiteKey,
		swPublickey: instance.swPublicKey,
		themeColor: instance.themeColor,
		bannerUrl: instance.bannerUrl,
		iconUrl: instance.iconUrl,
		backgroundImageUrl: instance.backgroundImageUrl,
		logoImageUrl: instance.logoImageUrl,
		maxNoteTextLength: config.maxNoteTextLength,
		emojis: await Emojis.packMany(emojis),
		defaultLightTheme: instance.defaultLightTheme,
		defaultDarkTheme: instance.defaultDarkTheme,
		enableEmail: instance.enableEmail,

		translatorAvailable: translatorAvailable(instance),

		pinnedPages: instance.pinnedPages,
		pinnedClipId: instance.pinnedClipId,
		cacheRemoteFiles: instance.cacheRemoteFiles,
		requireSetup: (await Users.countBy({
			host: IsNull(),
		})) === 0,

		proxyAccountName: instance.proxyAccountId ? (await Users.pack(instance.proxyAccountId).catch(() => null))?.username : null,

		images: config.images,

		features: {
			registration: !instance.disableRegistration,
			localTimeLine: !instance.disableLocalTimeline,
			globalTimeLine: !instance.disableGlobalTimeline,
			emailRequiredForSignup: instance.emailRequiredForSignup,
			elasticsearch: config.elasticsearch ? true : false,
			hcaptcha: instance.enableHcaptcha,
			recaptcha: instance.enableRecaptcha,
			objectStorage: instance.useObjectStorage,
			serviceWorker: true,
			miauth: true,
		},
	};
});
