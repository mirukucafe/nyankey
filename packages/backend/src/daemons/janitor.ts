// TODO: 消したい

import { LessThan } from 'typeorm';
import { AttestationChallenges } from '@/models/index.js';

const interval = 30 * 60 * 1000;

/**
 * Clean up database occasionally
 */
export function janitor(): void {
	async function tick(): Promise<void> {
		await AttestationChallenges.delete({
			createdAt: LessThan(new Date(new Date().getTime() - 5 * 60 * 1000)),
		});
	}

	tick();

	setInterval(tick, interval);
}
