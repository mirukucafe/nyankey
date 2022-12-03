import { Instance } from '@/models/entities/instance.js';
import { Instances } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { toPuny } from '@/misc/convert-host.js';
import { Cache } from '@/misc/cache.js';
import { HOUR } from '@/const.js';

const cache = new Cache<Instance>(
	HOUR,
	async (host) => {
		if (host == null) return undefined;
		const res = await Instances.findOneBy({ host });
		return res ?? undefined;
	} ,
);

export async function registerOrFetchInstanceDoc(idnHost: string): Promise<Instance> {
	const host = toPuny(idnHost);

	const cached = await cache.fetch(host);
	if (cached != null) return cached;

	// apparently a new instance
	const i = await Instances.insert({
		id: genId(),
		host,
		caughtAt: new Date(),
		lastCommunicatedAt: new Date(),
	}).then(x => Instances.findOneByOrFail(x.identifiers[0]));

	cache.set(host, i);
	return i;
}
