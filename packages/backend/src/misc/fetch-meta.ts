import push from 'web-push';
import { db } from '@/db/postgre.js';
import { Meta } from '@/models/entities/meta.js';
import { getFetchInstanceMetadataLock } from '@/misc/app-lock.js';

let cache: Meta | undefined;

/**
 * Performs the primitive database operation to set the server configuration
 */
export async function setMeta(meta: Meta): Promise<void> {
	const unlock = await getFetchInstanceMetadataLock('localhost');

	// try to mitigate older bugs where multiple meta entries may have been created
	await db.manager.clear(Meta);
	await db.manager.insert(Meta, meta);

	cache = meta;

	unlock();
}

/**
 * Performs the primitive database operation to fetch server configuration.
 * If there is no entry yet, inserts a new one.
 * Writes to `cache` instead of returning.
 */
async function getMeta(): Promise<void> {
	const unlock = await getFetchInstanceMetadataLock('localhost');

	// new IDs are prioritised because multiple records may have been created due to past bugs
	let metas = await db.manager.find(Meta, {
		order: {
			id: 'DESC',
		},
	});
	if (metas.length === 0) {
		const { publicKey, privateKey } = push.generateVAPIDKeys();
		await db.manager.insert(Meta, {
			id: 'x',
			swPublicKey: publicKey,
			swPrivateKey: privateKey,
		});
		metas = await db.manager.find(Meta, {
			order: {
				id: 'DESC',
			},
		});
	}
	cache = metas[0];

	unlock();
}

export async function fetchMeta(noCache = false): Promise<Meta> {
	if (!noCache && cache) return cache;

	await getMeta();

	return cache!;
}
