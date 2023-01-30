import Bull from 'bull';
import { In, LessThan } from 'typeorm';
import { AttestationChallenges, AuthSessions, Mutings, Notifications, PasswordResetRequests, Signins } from '@/models/index.js';
import { publishUserEvent } from '@/services/stream.js';
import { MINUTE, MONTH } from '@/const.js';
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

	const OlderThan = (millis: number) => {
		return LessThan(new Date(new Date().getTime() - millis));
	};

	await Signins.delete({
		createdAt: OlderThan(2 * MONTH),
	});

	await AttestationChallenges.delete({
		createdAt: OlderThan(5 * MINUTE),
	});

	await PasswordResetRequests.delete({
		// this timing should be the same as in @/server/api/endpoints/reset-password.ts
		createdAt: OlderThan(30 * MINUTE),
	});

	await AuthSessions.delete({
		createdAt: OlderThan(15 * MINUTE),
	});

	await Notifications.delete({
		isRead: true,
		createdAt: OlderThan(3 * MONTH),
	});

	logger.succ('Deleted expired data.');

	done();
}
