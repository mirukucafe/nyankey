import { fetchMeta } from '@/misc/fetch-meta.js';
import { Instance } from '@/models/entities/instance.js';
import { Meta } from '@/models/entities/meta.js';

/**
 * Returns whether a specific host (punycoded) should be blocked.
 *
 * @param host punycoded instance host
 * @param meta a Promise contatining the information from the meta table (optional)
 * @returns whether the given host should be blocked
 */

export async function shouldBlockInstance(host: Instance['host'], meta: Promise<Meta> = fetchMeta()): Promise<boolean> {
	const { blockedHosts } = await meta;
	return blockedHosts.some(blockedHost => host === blockedHost || host.endsWith('.' + blockedHost));
}
