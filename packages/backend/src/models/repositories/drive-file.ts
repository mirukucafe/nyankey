import { db } from '@/db/postgre.js';
import { DriveFile } from '@/models/entities/drive-file.js';
import { User } from '@/models/entities/user.js';
import { toPuny } from '@/misc/convert-host.js';
import { awaitAll } from '@/prelude/await-all.js';
import { Packed } from '@/misc/schema.js';
import config from '@/config/index.js';
import { query, appendQuery } from '@/prelude/url.js';
import { Users, DriveFolders } from '../index.js';

type PackOptions = {
	detail?: boolean,
	self?: boolean,
	withUser?: boolean,
};

export const DriveFileRepository = db.getRepository(DriveFile).extend({
	validateFileName(name: string): boolean {
		return (
			(name.trim().length > 0) &&
			(name.length <= 200) &&
			(name.indexOf('\\') === -1) &&
			(name.indexOf('/') === -1) &&
			(name.indexOf('..') === -1)
		);
	},

	getPublicProperties(file: DriveFile): DriveFile['properties'] {
		if (file.properties.orientation != null) {
			const properties = structuredClone(file.properties);
			if (file.properties.orientation >= 5) {
				[properties.width, properties.height] = [properties.height, properties.width];
			}
			properties.orientation = undefined;
			return properties;
		}

		return file.properties;
	},

	getPublicUrl(file: DriveFile, thumbnail = false): string | null {
		// リモートかつメディアプロキシ
		if (file.uri != null && file.userHost != null && config.mediaProxy != null) {
			return appendQuery(config.mediaProxy, query({
				url: file.uri,
				thumbnail: thumbnail ? '1' : undefined,
			}));
		}

		// リモートかつ期限切れはローカルプロキシを試みる
		if (file.uri != null && file.isLink && config.proxyRemoteFiles) {
			const key = thumbnail ? file.thumbnailAccessKey : file.webpublicAccessKey;

			if (key && !key.match('/')) {	// 古いものはここにオブジェクトストレージキーが入ってるので除外
				return `${config.url}/files/${key}`;
			}
		}

		const isImage = file.type && ['image/png', 'image/apng', 'image/gif', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type);

		return thumbnail ? (file.thumbnailUrl || (isImage ? (file.webpublicUrl || file.url) : null)) : (file.webpublicUrl || file.url);
	},

	calcDriveUsageOf(id: User['id']): Promise<number> {
		return db.query('SELECT SUM(size) AS sum FROM drive_file WHERE "userId" = $1 AND NOT "isLink"', [id])
			.then(res => res[0].sum as number ?? 0);
	},

	calcDriveUsageOfHost(host: string): Promise<number> {
		return db.query('SELECT SUM(size) AS sum FROM drive_file WHERE "userHost" = $1 AND NOT "isLink"', [toPuny(host)])
			.then(res => res[0].sum as number ?? 0);
	},

	calcDriveUsageOfLocal(): Promise<number> {
		return db.query('SELECT SUM(size) AS sum FROM drive_file WHERE "userHost" IS NULL AND NOT "isLink"')
			.then(res => res[0].sum as number ?? 0);
	},

	calcDriveUsageOfRemote(): Promise<number> {
		return db.query('SELECT SUM(size) AS sum FROM drive_file WHERE "userHost" IS NOT NULL AND NOT "isLink"')
			.then(res => res[0].sum as number ?? 0);
	},

	async pack(
		src: DriveFile['id'] | DriveFile,
		options?: PackOptions,
	): Promise<Packed<'DriveFile'>> {
		const opts = Object.assign({
			detail: false,
			self: false,
		}, options);

		const file = typeof src === 'object' ? src : await this.findOneByOrFail({ id: src });

		return await awaitAll<Packed<'DriveFile'>>({
			id: file.id,
			createdAt: file.createdAt.toISOString(),
			name: file.name,
			type: file.type,
			md5: file.md5,
			size: file.size,
			isSensitive: file.isSensitive,
			blurhash: file.blurhash,
			properties: opts.self ? file.properties : this.getPublicProperties(file),
			url: opts.self ? file.url : this.getPublicUrl(file, false),
			thumbnailUrl: this.getPublicUrl(file, true),
			comment: file.comment,
			folderId: file.folderId,
			folder: opts.detail && file.folderId ? DriveFolders.pack(file.folderId, {
				detail: true,
			}) : undefined,
			userId: file.userId,
			user: (opts.withUser && file.userId) ? Users.pack(file.userId) : undefined,
		});
	},

	async packNullable(
		src: DriveFile['id'] | DriveFile,
		options?: PackOptions,
	): Promise<Packed<'DriveFile'> | null> {
		const opts = Object.assign({
			detail: false,
			self: false,
		}, options);

		const file = typeof src === 'object' ? src : await this.findOneBy({ id: src });
		if (file == null) return null;

		return await this.pack(file, opts);
	},

	async packMany(
		files: (DriveFile['id'] | DriveFile)[],
		options?: PackOptions,
	): Promise<Packed<'DriveFile'>[]> {
		const items = await Promise.all(files.map(f => this.packNullable(f, options)));
		return items.filter((x): x is Packed<'DriveFile'> => x != null);
	},
});
