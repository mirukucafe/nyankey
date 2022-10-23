import Bull from 'bull';
import { In, LessThan } from 'typeorm';
import { AttestationChallenges, Mutings, PasswordResetRequests, Signins } from '@/models/index.js';
import { publishUserEvent } from '@/services/stream.js';
import { MINUTE, DAY } from '@/const.js';
import { queueLogger } from '@/queue/logger.js';

const logger = queueLogger.createSubLogger('check-expired');

export async function checkExpired(job: Bull.Job<Record<string, unknown>>, done: any): Promise<void> {
	logger.info('Checking expired data...');

	const expiredMutings = await Mutings.createQueryBuilder('muting')
		.where('muting.expiresAt IS NOT NULL')
		.andWhere('muting.expiresAt < :now', { now: new Date() })
		.innerJoinAndSelect('muting.mutee', 'mutee')
		.getMany();

	if (expiredMutings.length > 0) {
		await Mutings.delete({
			id: In(expiredMutings.map(m => m.id)),
		});

		for (const m of expiredMutings) {
			publishUserEvent(m.muterId, 'unmute', m.mutee!);
		}
	}

	await Signins.delete({
		// 60 days, or roughly equal to two months
		createdAt: LessThan(new Date(new Date().getTime() - 60 * DAY)),
	});

	await AttestationChallenges.delete({
		createdAt: LessThan(new Date(new Date().getTime() - 5 * MINUTE)),
	});

	await PasswordResetRequests.delete({
		// this timing should be the same as in @/server/api/endpoints/reset-password.ts
		createdAt: LessThan(new Date(new Date().getTime() - 30 * MINUTE)),
	});

	logger.succ('Deleted expired mutes, signins and attestation challenges.');

	done();
}
