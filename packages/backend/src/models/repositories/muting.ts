import { EntityRepository, Repository } from 'typeorm';
import { Users } from '../index.js';
import { Muting } from '@/models/entities/muting.js';
import { awaitAll } from '@/prelude/await-all.js';
import { Packed } from '@/misc/schema.js';
import { User } from '@/models/entities/user.js';

@EntityRepository(Muting)
export class MutingRepository extends Repository<Muting> {
	public async pack(
		src: Muting['id'] | Muting,
		me?: { id: User['id'] } | null | undefined
	): Promise<Packed<'Muting'>> {
		const muting = typeof src === 'object' ? src : await this.findOneOrFail(src);

		return await awaitAll({
			id: muting.id,
			createdAt: muting.createdAt.toISOString(),
			expiresAt: muting.expiresAt ? muting.expiresAt.toISOString() : null,
			muteeId: muting.muteeId,
			mutee: Users.pack(muting.muteeId, me, {
				detail: true,
			}),
		});
	}

	public packMany(
		mutings: any[],
		me: { id: User['id'] }
	) {
		return Promise.all(mutings.map(x => this.pack(x, me)));
	}
}