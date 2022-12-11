import { uploadFromUrl } from '@/services/drive/upload-from-url.js';
import { CacheableRemoteUser } from '@/models/entities/user.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { DriveFile } from '@/models/entities/drive-file.js';
import { DriveFiles } from '@/models/index.js';
import { truncate } from '@/misc/truncate.js';
import { DB_MAX_IMAGE_COMMENT_LENGTH } from '@/misc/hard-limits.js';
import { Resolver } from '@/remote/activitypub/resolver.js';
import { apLogger } from '../logger.js';

/**
 * Imageを作成します。
 */
export async function createImage(actor: CacheableRemoteUser, value: any, resolver: Resolver): Promise<DriveFile> {
	// 投稿者が凍結されていたらスキップ
	if (actor.isSuspended) {
		throw new Error('actor has been suspended');
	}

	const image = await resolver.resolve(value) as any;

	if (image.url == null) {
		throw new Error('invalid image: url not privided');
	}

	apLogger.info(`Creating the Image: ${image.url}`);

	const instance = await fetchMeta();

	let file = await uploadFromUrl({
		url: image.url,
		user: actor,
		uri: image.url,
		sensitive: image.sensitive,
		isLink: !instance.cacheRemoteFiles,
		comment: truncate(image.name, DB_MAX_IMAGE_COMMENT_LENGTH),
	});

	if (file.isLink) {
		// URLが異なっている場合、同じ画像が以前に異なるURLで登録されていたということなので、
		// URLを更新する
		if (file.url !== image.url) {
			await DriveFiles.update({ id: file.id }, {
				url: image.url,
				uri: image.url,
			});

			file = await DriveFiles.findOneByOrFail({ id: file.id });
		}
	}

	return file;
}

/**
 * Resolve Image.
 *
 * If the target Image is registered in FoundKey, return it; otherwise, fetch it from the remote server and return it.
 * Fetch the image from the remote server, register it in FoundKey and return it.
 */
export async function resolveImage(actor: CacheableRemoteUser, value: any, resolver: Resolver): Promise<DriveFile> {
	// TODO

	// Fetch from remote server and register it.
	return await createImage(actor, value, resolver);
}
