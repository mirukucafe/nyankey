import { insertModerationLog } from '@/services/insert-moderation-log.js';
import { fetchMeta, setMeta } from '@/misc/fetch-meta.js';
import { TranslationService } from '@/models/entities/meta.js';
import define from '../../define.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		disableRegistration: { type: 'boolean', nullable: true },
		disableLocalTimeline: { type: 'boolean', nullable: true },
		disableGlobalTimeline: { type: 'boolean', nullable: true },
		useStarForReactionFallback: { type: 'boolean', nullable: true },
		pinnedUsers: { type: 'array', nullable: true, items: {
			type: 'string',
		} },
		hiddenTags: { type: 'array', nullable: true, items: {
			type: 'string',
		} },
		blockedHosts: { type: 'array', nullable: true, items: {
			type: 'string',
		} },
		themeColor: { type: 'string', nullable: true, pattern: '^#[0-9a-fA-F]{6}$' },
		bannerUrl: { type: 'string', nullable: true },
		iconUrl: { type: 'string', nullable: true },
		backgroundImageUrl: { type: 'string', nullable: true },
		logoImageUrl: { type: 'string', nullable: true },
		name: { type: 'string', nullable: true },
		description: { type: 'string', nullable: true },
		defaultLightTheme: { type: 'string', nullable: true },
		defaultDarkTheme: { type: 'string', nullable: true },
		localDriveCapacityMb: { type: 'integer' },
		remoteDriveCapacityMb: { type: 'integer' },
		cacheRemoteFiles: { type: 'boolean' },
		emailRequiredForSignup: { type: 'boolean' },
		enableHcaptcha: { type: 'boolean' },
		hcaptchaSiteKey: { type: 'string', nullable: true },
		hcaptchaSecretKey: { type: 'string', nullable: true },
		enableRecaptcha: { type: 'boolean' },
		recaptchaSiteKey: { type: 'string', nullable: true },
		recaptchaSecretKey: { type: 'string', nullable: true },
		proxyAccountId: { type: 'string', format: 'misskey:id', nullable: true },
		maintainerName: { type: 'string', nullable: true },
		maintainerEmail: { type: 'string', nullable: true },
		pinnedPages: { type: 'array', items: {
			type: 'string',
		} },
		pinnedClipId: { type: 'string', format: 'misskey:id', nullable: true },
		langs: { type: 'array', items: {
			type: 'string',
		} },
		summalyProxy: { type: 'string', nullable: true },
		translationService: { type: 'string', nullable: true, enum: [null, ...Object.values(TranslationService)] },
		deeplAuthKey: { type: 'string', nullable: true },
		libreTranslateAuthKey: { type: 'string', nullable: true },
		libreTranslateEndpoint: { type: 'string', nullable: true },
		enableEmail: { type: 'boolean' },
		email: { type: 'string', nullable: true },
		smtpSecure: { type: 'boolean' },
		smtpHost: { type: 'string', nullable: true },
		smtpPort: { type: 'integer', nullable: true },
		smtpUser: { type: 'string', nullable: true },
		smtpPass: { type: 'string', nullable: true },
		tosUrl: { type: 'string', nullable: true },
		useObjectStorage: { type: 'boolean' },
		objectStorageBaseUrl: { type: 'string', nullable: true },
		objectStorageBucket: { type: 'string', nullable: true },
		objectStoragePrefix: { type: 'string', nullable: true },
		objectStorageEndpoint: { type: 'string', nullable: true },
		objectStorageRegion: { type: 'string', nullable: true },
		objectStoragePort: { type: 'integer', nullable: true },
		objectStorageAccessKey: { type: 'string', nullable: true },
		objectStorageSecretKey: { type: 'string', nullable: true },
		objectStorageUseSSL: { type: 'boolean' },
		objectStorageUseProxy: { type: 'boolean' },
		objectStorageSetPublicRead: { type: 'boolean' },
		objectStorageS3ForcePathStyle: { type: 'boolean' },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const set = {} as Partial<Meta>;

	if (typeof ps.disableRegistration === 'boolean') {
		set.disableRegistration = ps.disableRegistration;
	}

	if (typeof ps.disableLocalTimeline === 'boolean') {
		set.disableLocalTimeline = ps.disableLocalTimeline;
	}

	if (typeof ps.disableGlobalTimeline === 'boolean') {
		set.disableGlobalTimeline = ps.disableGlobalTimeline;
	}

	if (typeof ps.useStarForReactionFallback === 'boolean') {
		set.useStarForReactionFallback = ps.useStarForReactionFallback;
	}

	if (Array.isArray(ps.pinnedUsers)) {
		set.pinnedUsers = ps.pinnedUsers.filter(Boolean);
	}

	if (Array.isArray(ps.hiddenTags)) {
		set.hiddenTags = ps.hiddenTags.filter(Boolean);
	}

	if (Array.isArray(ps.blockedHosts)) {
		set.blockedHosts = ps.blockedHosts.filter(Boolean);
	}

	if (ps.themeColor !== undefined) {
		set.themeColor = ps.themeColor;
	}

	if (ps.bannerUrl !== undefined) {
		set.bannerUrl = ps.bannerUrl;
	}

	if (ps.iconUrl !== undefined) {
		set.iconUrl = ps.iconUrl;
	}

	if (ps.backgroundImageUrl !== undefined) {
		set.backgroundImageUrl = ps.backgroundImageUrl;
	}

	if (ps.logoImageUrl !== undefined) {
		set.logoImageUrl = ps.logoImageUrl;
	}

	if (ps.name !== undefined) {
		set.name = ps.name;
	}

	if (ps.description !== undefined) {
		set.description = ps.description;
	}

	if (ps.defaultLightTheme !== undefined) {
		set.defaultLightTheme = ps.defaultLightTheme;
	}

	if (ps.defaultDarkTheme !== undefined) {
		set.defaultDarkTheme = ps.defaultDarkTheme;
	}

	if (ps.localDriveCapacityMb !== undefined) {
		set.localDriveCapacityMb = ps.localDriveCapacityMb;
	}

	if (ps.remoteDriveCapacityMb !== undefined) {
		set.remoteDriveCapacityMb = ps.remoteDriveCapacityMb;
	}

	if (ps.cacheRemoteFiles !== undefined) {
		set.cacheRemoteFiles = ps.cacheRemoteFiles;
	}

	if (ps.emailRequiredForSignup !== undefined) {
		set.emailRequiredForSignup = ps.emailRequiredForSignup;
	}

	if (ps.enableHcaptcha !== undefined) {
		set.enableHcaptcha = ps.enableHcaptcha;
	}

	if (ps.hcaptchaSiteKey !== undefined) {
		set.hcaptchaSiteKey = ps.hcaptchaSiteKey;
	}

	if (ps.hcaptchaSecretKey !== undefined) {
		set.hcaptchaSecretKey = ps.hcaptchaSecretKey;
	}

	if (ps.enableRecaptcha !== undefined) {
		set.enableRecaptcha = ps.enableRecaptcha;
	}

	if (ps.recaptchaSiteKey !== undefined) {
		set.recaptchaSiteKey = ps.recaptchaSiteKey;
	}

	if (ps.recaptchaSecretKey !== undefined) {
		set.recaptchaSecretKey = ps.recaptchaSecretKey;
	}

	if (ps.proxyAccountId !== undefined) {
		set.proxyAccountId = ps.proxyAccountId;
	}

	if (ps.maintainerName !== undefined) {
		set.maintainerName = ps.maintainerName;
	}

	if (ps.maintainerEmail !== undefined) {
		set.maintainerEmail = ps.maintainerEmail;
	}

	if (Array.isArray(ps.langs)) {
		set.langs = ps.langs.filter(Boolean);
	}

	if (Array.isArray(ps.pinnedPages)) {
		set.pinnedPages = ps.pinnedPages.filter(Boolean);
	}

	if (ps.pinnedClipId !== undefined) {
		set.pinnedClipId = ps.pinnedClipId;
	}

	if (ps.summalyProxy !== undefined) {
		set.summalyProxy = ps.summalyProxy;
	}

	if (ps.enableEmail !== undefined) {
		set.enableEmail = ps.enableEmail;
	}

	if (ps.email !== undefined) {
		set.email = ps.email;
	}

	if (ps.smtpSecure !== undefined) {
		set.smtpSecure = ps.smtpSecure;
	}

	if (ps.smtpHost !== undefined) {
		set.smtpHost = ps.smtpHost;
	}

	if (ps.smtpPort !== undefined) {
		set.smtpPort = ps.smtpPort;
	}

	if (ps.smtpUser !== undefined) {
		set.smtpUser = ps.smtpUser;
	}

	if (ps.smtpPass !== undefined) {
		set.smtpPass = ps.smtpPass;
	}

	if (ps.tosUrl !== undefined) {
		set.ToSUrl = ps.tosUrl;
	}

	if (ps.useObjectStorage !== undefined) {
		set.useObjectStorage = ps.useObjectStorage;
	}

	if (ps.objectStorageBaseUrl !== undefined) {
		set.objectStorageBaseUrl = ps.objectStorageBaseUrl;
	}

	if (ps.objectStorageBucket !== undefined) {
		set.objectStorageBucket = ps.objectStorageBucket;
	}

	if (ps.objectStoragePrefix !== undefined) {
		set.objectStoragePrefix = ps.objectStoragePrefix;
	}

	if (ps.objectStorageEndpoint !== undefined) {
		set.objectStorageEndpoint = ps.objectStorageEndpoint;
	}

	if (ps.objectStorageRegion !== undefined) {
		set.objectStorageRegion = ps.objectStorageRegion;
	}

	if (ps.objectStoragePort !== undefined) {
		set.objectStoragePort = ps.objectStoragePort;
	}

	if (ps.objectStorageAccessKey !== undefined) {
		set.objectStorageAccessKey = ps.objectStorageAccessKey;
	}

	if (ps.objectStorageSecretKey !== undefined) {
		set.objectStorageSecretKey = ps.objectStorageSecretKey;
	}

	if (ps.objectStorageUseSSL !== undefined) {
		set.objectStorageUseSSL = ps.objectStorageUseSSL;
	}

	if (ps.objectStorageUseProxy !== undefined) {
		set.objectStorageUseProxy = ps.objectStorageUseProxy;
	}

	if (ps.objectStorageSetPublicRead !== undefined) {
		set.objectStorageSetPublicRead = ps.objectStorageSetPublicRead;
	}

	if (ps.objectStorageS3ForcePathStyle !== undefined) {
		set.objectStorageS3ForcePathStyle = ps.objectStorageS3ForcePathStyle;
	}

	if (ps.translationService !== undefined) {
		set.translationService = ps.translationService;
	}

	if (ps.deeplAuthKey !== undefined) {
		if (ps.deeplAuthKey === '') {
			set.deeplAuthKey = null;
		} else {
			set.deeplAuthKey = ps.deeplAuthKey;
		}
	}

	if (ps.libreTranslateEndpoint !== undefined) {
		if (ps.libreTranslateEndpoint === '') {
			set.libreTranslateEndpoint = null;
		} else {
			set.libreTranslateEndpoint = ps.libreTranslateEndpoint;
		}
	}

	if (ps.libreTranslateAuthKey !== undefined) {
		if (ps.libreTranslateAuthKey === '') {
			set.libreTranslateAuthKey = null;
		} else {
			set.libreTranslateAuthKey = ps.libreTranslateAuthKey;
		}
	}

	const meta = await fetchMeta();
	await setMeta({
		...meta,
		...set,
	});

	insertModerationLog(me, 'updateMeta');
});
