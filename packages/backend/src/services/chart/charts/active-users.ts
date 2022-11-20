import { WEEK, MONTH, YEAR } from '@/const.js';
import { User } from '@/models/entities/user.js';
import Chart, { KVs } from '../core.js';
import { name, schema } from './entities/active-users.js';

/**
 * Chart on Active Users
 */
// eslint-disable-next-line import/no-default-export
export default class ActiveUsersChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	public async read(user: { id: User['id'], host: null, createdAt: User['createdAt'] }): Promise<void> {
		await this.commit({
			'read': [user.id],
			'registeredWithinWeek': (Date.now() - user.createdAt.getTime() < WEEK) ? [user.id] : [],
			'registeredWithinMonth': (Date.now() - user.createdAt.getTime() < MONTH) ? [user.id] : [],
			'registeredWithinYear': (Date.now() - user.createdAt.getTime() < YEAR) ? [user.id] : [],
			'registeredOutsideWeek': (Date.now() - user.createdAt.getTime() > WEEK) ? [user.id] : [],
			'registeredOutsideMonth': (Date.now() - user.createdAt.getTime() > MONTH) ? [user.id] : [],
			'registeredOutsideYear': (Date.now() - user.createdAt.getTime() > YEAR) ? [user.id] : [],
		});
	}

	public async write(user: { id: User['id'], host: null, createdAt: User['createdAt'] }): Promise<void> {
		await this.commit({
			'write': [user.id],
		});
	}
}
