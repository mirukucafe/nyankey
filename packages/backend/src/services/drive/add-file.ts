import * as fs from 'node:fs';

import { v4 as uuid } from 'uuid';
import S3 from 'aws-sdk/clients/s3.js';
import { In, IsNull } from 'typeorm';
import sharp from 'sharp';

import { db } from '@/db/postgre.js';
import { FILE_TYPE_BROWSERSAFE } from '@/const.js';
import { publishMainStream, publishDriveStream } from '@/services/stream.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { contentDisposition } from '@/misc/content-disposition.js';
import { getFileInfo } from '@/misc/get-file-info.js';
import { DriveFiles, DriveFolders, Users, UserProfiles } from '@/models/index.js';
import { DriveFile } from '@/models/entities/drive-file.js';
import { IRemoteUser, User } from '@/models/entities/user.js';
import { driveChart, perUserDriveChart, instanceChart } from '@/services/chart/index.js';
import { genId } from '@/misc/gen-id.js';
import { isDuplicateKeyValueError } from '@/misc/is-duplicate-key-value-error.js';
import { DriveFolder } from '@/models/entities/drive-folder.js';
import { deleteFile } from './delete-file.js';
import { GenerateVideoThumbnail } from './generate-video-thumbnail.js';
import { driveLogger } from './logger.js';
import { IImage, convertSharpToJpeg, convertSharpToWebp, convertSharpToPng } from './image-processor.js';
import { InternalStorage } from './internal-storage.js';
import { getS3 } from './s3.js';

const logger = driveLogger.createSubLogger('register', 'yellow');

/***
 * Save file
 * @param path Path for original
 * @param name Name for original
 * @param type Content-Type for original
 * @param hash Hash for original
 * @param size Size for original
 */
async function save(file: DriveFile, path: string, name: string, type: string, hash: string, size: number): Promise<DriveFile> {
	// thunbnail, webpublic を必要なら生成
	const alts = await generateAlts(path, type, !file.uri);

	const meta = await fetchMeta();

	if (meta.useObjectStorage) {
		//#region ObjectStorage params
		let [ext] = (name.match(/\.([a-zA-Z0-9_-]+)$/) || ['']);

		if (ext === '') {
			if (type === 'image/jpeg') ext = '.jpg';
			if (type === 'image/png') ext = '.png';
			if (type === 'image/webp') ext = '.webp';
			if (type === 'image/apng') ext = '.apng';
			if (type === 'image/vnd.mozilla.apng') ext = '.apng';
		}

		// 拡張子からContent-Typeを設定してそうな挙動を示すオブジェクトストレージ (upcloud?) も存在するので、
		// 許可されているファイル形式でしか拡張子をつけない
		if (!FILE_TYPE_BROWSERSAFE.includes(type)) {
			ext = '';
		}

		const baseUrl = meta.objectStorageBaseUrl
			|| `${ meta.objectStorageUseSSL ? 'https' : 'http' }://${ meta.objectStorageEndpoint }${ meta.objectStoragePort ? `:${meta.objectStoragePort}` : '' }/${ meta.objectStorageBucket }`;

		// for original
		const key = `${meta.objectStoragePrefix}/${uuid()}${ext}`;
		const url = `${ baseUrl }/${ key }`;

		// for alts
		let webpublicKey: string | null = null;
		let webpublicUrl: string | null = null;
		let thumbnailKey: string | null = null;
		let thumbnailUrl: string | null = null;
		//#endregion

		//#region Uploads
		logger.info(`uploading original: ${key}`);
		const uploads = [
			upload(key, fs.createReadStream(path), type, name),
		];

		if (alts.webpublic) {
			webpublicKey = `${meta.objectStoragePrefix}/webpublic-${uuid()}.${alts.webpublic.ext}`;
			webpublicUrl = `${ baseUrl }/${ webpublicKey }`;

			logger.info(`uploading webpublic: ${webpublicKey}`);
			uploads.push(upload(webpublicKey, alts.webpublic.data, alts.webpublic.type, name));
		}

		if (alts.thumbnail) {
			thumbnailKey = `${meta.objectStoragePrefix}/thumbnail-${uuid()}.${alts.thumbnail.ext}`;
			thumbnailUrl = `${ baseUrl }/${ thumbnailKey }`;

			logger.info(`uploading thumbnail: ${thumbnailKey}`);
			uploads.push(upload(thumbnailKey, alts.thumbnail.data, alts.thumbnail.type));
		}

		await Promise.all(uploads);
		//#endregion

		file.url = url;
		file.thumbnailUrl = thumbnailUrl;
		file.webpublicUrl = webpublicUrl;
		file.accessKey = key;
		file.thumbnailAccessKey = thumbnailKey;
		file.webpublicAccessKey = webpublicKey;
		file.webpublicType = alts.webpublic?.type ?? null;
		file.name = name;
		file.type = type;
		file.md5 = hash;
		file.size = size;
		file.storedInternal = false;

		return await DriveFiles.insert(file).then(x => DriveFiles.findOneByOrFail(x.identifiers[0]));
	} else { // use internal storage
		const accessKey = uuid();
		const thumbnailAccessKey = 'thumbnail-' + uuid();
		const webpublicAccessKey = 'webpublic-' + uuid();

		const url = InternalStorage.saveFromPath(accessKey, path);

		let thumbnailUrl: string | null = null;
		let webpublicUrl: string | null = null;

		if (alts.thumbnail) {
			thumbnailUrl = InternalStorage.saveFromBuffer(thumbnailAccessKey, alts.thumbnail.data);
			logger.info(`thumbnail stored: ${thumbnailAccessKey}`);
		}

		if (alts.webpublic) {
			webpublicUrl = InternalStorage.saveFromBuffer(webpublicAccessKey, alts.webpublic.data);
			logger.info(`web stored: ${webpublicAccessKey}`);
		}

		file.storedInternal = true;
		file.url = url;
		file.thumbnailUrl = thumbnailUrl;
		file.webpublicUrl = webpublicUrl;
		file.accessKey = accessKey;
		file.thumbnailAccessKey = thumbnailAccessKey;
		file.webpublicAccessKey = webpublicAccessKey;
		file.webpublicType = alts.webpublic?.type ?? null;
		file.name = name;
		file.type = type;
		file.md5 = hash;
		file.size = size;

		return await DriveFiles.insert(file).then(x => DriveFiles.findOneByOrFail(x.identifiers[0]));
	}
}

/**
 * Generate webpublic, thumbnail, etc
 * @param path Path for original
 * @param type Content-Type for original
 * @param generateWeb Generate webpublic or not
 */
export async function generateAlts(path: string, type: string, generateWeb: boolean): Promise<{
	webpublic: IImage | null;
	thumbnail: IImage | null;
}> {
	if (type.startsWith('video/')) {
		try {
			const thumbnail = await GenerateVideoThumbnail(path);
			return {
				webpublic: null,
				thumbnail,
			};
		} catch (err) {
			logger.warn(`GenerateVideoThumbnail failed: ${err}`);
			return {
				webpublic: null,
				thumbnail: null,
			};
		}
	}

	if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(type)) {
		logger.debug('web image and thumbnail not created (not an required file)');
		return {
			webpublic: null,
			thumbnail: null,
		};
	}

	let img: sharp.Sharp | null = null;
	let satisfyWebpublic: boolean;

	try {
		img = sharp(path);
		const metadata = await img.metadata();
		const isAnimated = metadata.pages && metadata.pages > 1;

		// skip animated
		if (isAnimated) {
			return {
				webpublic: null,
				thumbnail: null,
			};
		}

		satisfyWebpublic = !!(
			type !== 'image/svg+xml' && type !== 'image/webp' &&
			!(metadata.exif || metadata.iptc || metadata.xmp || metadata.tifftagPhotoshop) &&
			metadata.width && metadata.width <= 2048 &&
			metadata.height && metadata.height <= 2048
		);
	} catch (err) {
		logger.warn(`sharp failed: ${err}`);
		return {
			webpublic: null,
			thumbnail: null,
		};
	}

	// #region webpublic
	let webpublic: IImage | null = null;

	if (generateWeb && !satisfyWebpublic) {
		logger.info('creating web image');

		try {
			if (['image/jpeg', 'image/webp'].includes(type)) {
				webpublic = await convertSharpToJpeg(img, 2048, 2048);
			} else if (['image/png'].includes(type)) {
				webpublic = await convertSharpToPng(img, 2048, 2048);
			} else if (['image/svg+xml'].includes(type)) {
				webpublic = await convertSharpToPng(img, 2048, 2048);
			} else {
				logger.debug('web image not created (not an required image)');
			}
		} catch (err) {
			logger.warn('web image not created (an error occured)', err as Error);
		}
	} else {
		if (satisfyWebpublic) logger.info('web image not created (original satisfies webpublic)');
		else logger.info('web image not created (from remote)');
	}
	// #endregion webpublic

	// #region thumbnail
	let thumbnail: IImage | null = null;

	try {
		if (['image/jpeg', 'image/webp', 'image/png', 'image/svg+xml'].includes(type)) {
			thumbnail = await convertSharpToWebp(img, 498, 280);
		} else {
			logger.debug('thumbnail not created (not an required file)');
		}
	} catch (err) {
		logger.warn('thumbnail not created (an error occured)', err as Error);
	}
	// #endregion thumbnail

	return {
		webpublic,
		thumbnail,
	};
}

/**
 * Upload to ObjectStorage
 */
async function upload(key: string, stream: fs.ReadStream | Buffer, _type: string, filename?: string): Promise<void> {
	const type = (_type === 'image/apng')
		? 'image/png'
		: (FILE_TYPE_BROWSERSAFE.includes(_type))
			? _type
			: 'application/octet-stream';

	const meta = await fetchMeta();

	const params = {
		Bucket: meta.objectStorageBucket,
		Key: key,
		Body: stream,
		ContentType: type,
		CacheControl: 'max-age=31536000, immutable',
	} as S3.PutObjectRequest;

	if (filename) params.ContentDisposition = contentDisposition('inline', filename);
	if (meta.objectStorageSetPublicRead) params.ACL = 'public-read';

	const s3 = getS3(meta);

	const upload = s3.upload(params, {
		partSize: s3.endpoint.hostname === 'storage.googleapis.com' ? 500 * 1024 * 1024 : 8 * 1024 * 1024,
	});

	const result = await upload.promise();
	if (result) logger.debug(`Uploaded: ${result.Bucket}/${result.Key} => ${result.Location}`);
}

async function expireOldFiles(user: IRemoteUser, driveCapacity: number): Promise<void> {
	// Delete as many files as necessary so the total usage is below driveCapacity,
	// oldest files first, and exclude avatar and banner.
	//
	// Using a window function, i.e. `OVER (ORDER BY "createdAt" DESC)` means that
	// the `SUM` will be a running total.
	const exceededFileIds = await db.query('SELECT "id" FROM ('
		+ 'SELECT "id", SUM("size") OVER (ORDER BY "createdAt" DESC) AS "total" FROM "drive_file" WHERE "userId" = $1 AND NOT "isLink"'
		+ (user.avatarId ? ' AND "id" != $2' : '')
		+ (user.bannerId ? ' AND "id" != $3' : '')
		+ ') AS "totals" WHERE "total" > $4',
		[
			user.id,
			user.avatarId ?? '',
			user.bannerId ?? '',
			driveCapacity,
		]
	);

	if (exceededFileIds.length === 0) {
		// no files to expire, avatar and banner if present are already the only files
		throw new Error('remote user drive quota met by avatar and banner');
	}

	const files = await DriveFiles.findBy({
		id: In(exceededFileIds.map(x => x.id)),
	});

	for (const file of files) {
		deleteFile(file, true);
	}
}

type AddFileArgs = {
	/** User who wish to add file */
	user: { id: User['id']; host: User['host'] } | null;
	/** File path */
	path: string;
	/** Name */
	name?: string | null;
	/** Comment */
	comment?: string | null;
	/** Folder ID */
	parentId?: any;
	/** If set to true, forcibly upload the file even if there is a file with the same hash. */
	force?: boolean;
	/** Do not save file to local */
	isLink?: boolean;
	/** URL of source (URLからアップロードされた場合(ローカル/リモート)の元URL) */
	url?: string | null;
	/** URL of source (リモートインスタンスのURLからアップロードされた場合の元URL) */
	uri?: string | null;
	/** Mark file as sensitive */
	sensitive?: boolean | null;
};

/**
 * Add file to drive
 *
 */
export async function addFile({
	user,
	path,
	name = null,
	comment = null,
	parentId = null,
	force = false,
	isLink = false,
	url = null,
	uri = null,
	sensitive = null,
}: AddFileArgs): Promise<DriveFile> {
	const info = await getFileInfo(path);
	logger.info(`${JSON.stringify(info)}`);

	// detect name
	const detectedName = name || (info.type.ext ? `untitled.${info.type.ext}` : 'untitled');

	if (user && !force) {
		// Check if there is a file with the same hash
		const much = await DriveFiles.findOneBy({
			md5: info.md5,
			userId: user.id,
		});

		if (much) {
			logger.info(`file with same hash is found: ${much.id}`);
			return much;
		}
	}

	//#region Check drive usage
	if (user && !isLink) {
		const usage = await DriveFiles.calcDriveUsageOf(user.id);
		const isLocalUser = Users.isLocalUser(user);

		const instance = await fetchMeta();
		const driveCapacity = 1024 * 1024 * (isLocalUser ? instance.localDriveCapacityMb : instance.remoteDriveCapacityMb);

		logger.debug(`drive usage is ${usage} (max: ${driveCapacity})`);

		// If usage limit exceeded
		if (usage + info.size > driveCapacity) {
			if (isLocalUser) {
				throw new Error('no-free-space');
			} else {
				// delete older files to make space for new file
				expireOldFiles(await Users.findOneByOrFail({ id: user.id }) as IRemoteUser, driveCapacity - info.size);
			}
		}
	}
	//#endregion

	const fetchFolder = async (): Promise<DriveFolder | null> => {
		if (!parentId) {
			return null;
		}

		const driveFolder = await DriveFolders.findOneBy({
			id: parentId,
			userId: user ? user.id : IsNull(),
		});

		if (driveFolder == null) throw new Error('folder-not-found');

		return driveFolder;
	};

	const properties: {
		width?: number;
		height?: number;
		orientation?: number;
	} = {};

	if (info.width) {
		properties['width'] = info.width;
		properties['height'] = info.height;
	}
	if (info.orientation != null) {
		properties['orientation'] = info.orientation;
	}

	const profile = user ? await UserProfiles.findOneBy({ userId: user.id }) : null;

	const folder = await fetchFolder();

	let file = new DriveFile();
	file.id = genId();
	file.createdAt = new Date();
	file.userId = user ? user.id : null;
	file.userHost = user ? user.host : null;
	file.parentId = folder?.id ?? null;
	file.comment = comment;
	file.properties = properties;
	file.blurhash = info.blurhash || null;
	file.isLink = isLink;
	file.isSensitive = user
		? Users.isLocalUser(user) && profile!.alwaysMarkNsfw
			? true
			: sensitive ?? false
		: false;

	if (url !== null) {
		file.src = url;

		if (isLink) {
			file.url = url;
			// ローカルプロキシ用
			file.accessKey = uuid();
			file.thumbnailAccessKey = 'thumbnail-' + uuid();
			file.webpublicAccessKey = 'webpublic-' + uuid();
		}
	}

	if (uri !== null) {
		file.uri = uri;
	}

	if (isLink) {
		try {
			file.size = 0;
			file.md5 = info.md5;
			file.name = detectedName;
			file.type = info.type.mime;
			file.storedInternal = false;

			file = await DriveFiles.insert(file).then(x => DriveFiles.findOneByOrFail(x.identifiers[0]));
		} catch (err) {
			// duplicate key error (when already registered)
			if (isDuplicateKeyValueError(err)) {
				logger.info(`already registered ${file.uri}`);

				file = await DriveFiles.findOneBy({
					uri: file.uri!,
					userId: user ? user.id : IsNull(),
				}) as DriveFile;
			} else {
				logger.error(err as Error);
				throw err;
			}
		}
	} else {
		file = await (save(file, path, detectedName, info.type.mime, info.md5, info.size));
	}

	logger.succ(`drive file has been created ${file.id}`);

	if (user) {
		DriveFiles.pack(file, { self: true }).then(packedFile => {
			// Publish driveFileCreated event
			publishMainStream(user.id, 'driveFileCreated', packedFile);
			publishDriveStream(user.id, 'fileCreated', packedFile);
		});
	}

	// 統計を更新
	driveChart.update(file, true);
	perUserDriveChart.update(file, true);
	if (file.userHost !== null) {
		instanceChart.updateDrive(file, true);
	}

	return file;
}
