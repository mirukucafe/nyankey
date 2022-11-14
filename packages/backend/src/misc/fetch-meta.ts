import push from 'web-push';
import { db } from '@/db/postgre.js';
import { Meta } from '@/models/entities/meta.js';
import { getFetchInstanceMetadataLock } from '@/misc/app-lock.js';

let cache: Meta;

/**
 * Performs the primitive database operation to set the server configuration
 */
export async function setMeta(meta: Meta): Promise<void> {
	const unlock = await getFetchInstanceMetadataLock('localhost');

	// try to mitigate older bugs where multiple meta entries may have been created
	db.manager.clear(Meta);
	db.manager.insert(Meta, meta);

	unlock();
}

/**
 * Performs the primitive database operation to fetch server configuration.
 * Writes to `cache` instead of returning.
 */
async function getMeta(): Promise<void> {
	const unlock = await getFetchInstanceMetadataLock('localhost');

	// new IDs are prioritised because multiple records may have been created due to past bugs
	cache = db.manager.findOne(Meta, {
		order: {
			id: 'DESC',
		},
	});

	unlock();
}

export async function fetchMeta(noCache = false): Promise<Meta> {
	if (!noCache && cache) return cache;

	await getMeta();

	return cache;
}
