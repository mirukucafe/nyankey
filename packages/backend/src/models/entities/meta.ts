import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../id.js';
import { User } from './user.js';
import { Clip } from './clip.js';

export enum TranslationService {
	DeepL = 'deepl',
	LibreTranslate = 'libretranslate',
}

@Entity()
export class Meta {
	@PrimaryColumn({
		type: 'varchar',
		length: 32,
	})
	public id: string;

	@Column('varchar', {
		length: 128, nullable: true,
	})
	public name: string | null;

	@Column('varchar', {
		length: 1024, nullable: true,
	})
	public description: string | null;

	/**
	 * メンテナの名前
	 */
	@Column('varchar', {
		length: 128, nullable: true,
	})
	public maintainerName: string | null;

	/**
	 * メンテナの連絡先
	 */
	@Column('varchar', {
		length: 128, nullable: true,
	})
	public maintainerEmail: string | null;

	@Column('boolean', {
		default: false,
	})
	public disableRegistration: boolean;

	@Column('boolean', {
		default: false,
	})
	public disableLocalTimeline: boolean;

	@Column('boolean', {
		default: false,
	})
	public disableGlobalTimeline: boolean;

	@Column('boolean', {
		default: false,
	})
	public useStarForReactionFallback: boolean;

	@Column('varchar', {
		length: 64, array: true, default: '{}',
	})
	public langs: string[];

	@Column('varchar', {
		length: 256, array: true, default: '{}',
	})
	public pinnedUsers: string[];

	@Column('varchar', {
		length: 256, array: true, default: '{}',
	})
	public hiddenTags: string[];

	@Column('varchar', {
		length: 256, array: true, default: '{}',
	})
	public blockedHosts: string[];

	@Column('varchar', {
		length: 512, array: true, default: '{/featured,/channels,/explore,/pages,/about-foundkey}',
	})
	public pinnedPages: string[];

	@Column({
		...id(),
		nullable: true,
	})
	public pinnedClipId: Clip['id'] | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
	})
	public themeColor: string | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
	})
	public bannerUrl: string | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
	})
	public backgroundImageUrl: string | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
	})
	public logoImageUrl: string | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
	})
	public iconUrl: string | null;

	@Column('boolean', {
		default: true,
	})
	public cacheRemoteFiles: boolean;

	@Column({
		...id(),
		nullable: true,
	})
	public proxyAccountId: User['id'] | null;

	@ManyToOne(() => User, {
		onDelete: 'SET NULL',
	})
	@JoinColumn()
	public proxyAccount: User | null;

	@Column('boolean', {
		default: false,
	})
	public emailRequiredForSignup: boolean;

	@Column('boolean', {
		default: false,
	})
	public enableHcaptcha: boolean;

	@Column('varchar', {
		length: 64,
		nullable: true,
	})
	public hcaptchaSiteKey: string | null;

	@Column('varchar', {
		length: 64,
		nullable: true,
	})
	public hcaptchaSecretKey: string | null;

	@Column('boolean', {
		default: false,
	})
	public enableRecaptcha: boolean;

	@Column('varchar', {
		length: 64,
		nullable: true,
	})
	public recaptchaSiteKey: string | null;

	@Column('varchar', {
		length: 64,
		nullable: true,
	})
	public recaptchaSecretKey: string | null;

	@Column('integer', {
		default: 1024,
		comment: 'Drive capacity of a local user (MB)',
	})
	public localDriveCapacityMb: number;

	@Column('integer', {
		default: 32,
		comment: 'Drive capacity of a remote user (MB)',
	})
	public remoteDriveCapacityMb: number;

	@Column('varchar', {
		length: 128,
		nullable: true,
	})
	public summalyProxy: string | null;

	@Column('boolean', {
		default: false,
	})
	public enableEmail: boolean;

	@Column('varchar', {
		length: 128,
		nullable: true,
	})
	public email: string | null;

	@Column('boolean', {
		default: false,
	})
	public smtpSecure: boolean;

	@Column('varchar', {
		length: 128,
		nullable: true,
	})
	public smtpHost: string | null;

	@Column('integer', {
		nullable: true,
	})
	public smtpPort: number | null;

	@Column('varchar', {
		length: 128,
		nullable: true,
	})
	public smtpUser: string | null;

	@Column('varchar', {
		length: 128,
		nullable: true,
	})
	public smtpPass: string | null;

	@Column('varchar', {
		length: 128,
	})
	public swPublicKey: string;

	@Column('varchar', {
		length: 128,
	})
	public swPrivateKey: string;

	@Column('enum', {
		enum: TranslationService,
		nullable: true,
	})
	public translationService: TranslationService | null;

	@Column('varchar', {
		length: 128,
		nullable: true,
	})
	public deeplAuthKey: string | null;

	@Column('varchar', {
		length: 128,
		nullable: true,
	})
	public libreTranslateAuthKey: string | null;

	@Column('varchar', {
		length: 2048,
		nullable: true,
	})
	public libreTranslateEndpoint: string | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
	})
	public ToSUrl: string | null;

	@Column('varchar', {
		length: 8192,
		nullable: true,
	})
	public defaultLightTheme: string | null;

	@Column('varchar', {
		length: 8192,
		nullable: true,
	})
	public defaultDarkTheme: string | null;

	@Column('boolean', {
		default: false,
	})
	public useObjectStorage: boolean;

	@Column('varchar', {
		length: 512,
		nullable: true,
	})
	public objectStorageBucket: string | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
	})
	public objectStoragePrefix: string | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
	})
	public objectStorageBaseUrl: string | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
	})
	public objectStorageEndpoint: string | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
	})
	public objectStorageRegion: string | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
	})
	public objectStorageAccessKey: string | null;

	@Column('varchar', {
		length: 512,
		nullable: true,
	})
	public objectStorageSecretKey: string | null;

	@Column('integer', {
		nullable: true,
	})
	public objectStoragePort: number | null;

	@Column('boolean', {
		default: true,
	})
	public objectStorageUseSSL: boolean;

	@Column('boolean', {
		default: true,
	})
	public objectStorageUseProxy: boolean;

	@Column('boolean', {
		default: false,
	})
	public objectStorageSetPublicRead: boolean;

	@Column('boolean', {
		default: true,
	})
	public objectStorageS3ForcePathStyle: boolean;
}
