import Bull from 'bull';
import { In, LessThan } from 'typeorm';
import { AttestationChallenges, AuthSessions, Mutings, Notifications, PasswordResetRequests, Signins, Users } from '@/models/index.js';
import { publishUserEvent } from '@/services/stream.js';
import { MINUTE, MONTH } from '@/const.js';
import { queueLogger } from '@/queue/logger.js';

const logger = queueLogger.createSubLogger('check-expired');

export async function checkExpired(job: Bull.Job<Record<string, unknown>>, done: any): Promise<void> {
	logger.info('Checking expired data...');

	const OlderThan = (millis: number) => {
		return LessThan(new Date(new Date().getTime() - millis));
	};

	await Promise.all([
		Mutings.createQueryBuilder('muting')
			.where('muting.expiresAt IS NOT NULL')
			.andWhere('muting.expiresAt < :now', { now: new Date() })
			.innerJoinAndSelect('muting.mutee', 'mutee')
			.getMany()
			.then(async (expiredMutings) => {
				if (expiredMutings.length > 0) {
					await Mutings.delete({
						id: In(expiredMutings.map(m => m.id)),
					});

					for (const m of expiredMutings) {
						publishUserEvent(m.muterId, 'unmute', m.mutee!);
					}
				}
			}),
		Signins.delete({
			createdAt: OlderThan(2 * MONTH),
		}),
		AttestationChallenges.delete({
			createdAt: OlderThan(5 * MINUTE),
		}),
		PasswordResetRequests.delete({
			// this timing should be the same as in @/server/api/endpoints/reset-password.ts
			createdAt: OlderThan(30 * MINUTE),
		}),
		AuthSessions.delete({
			createdAt: OlderThan(15 * MINUTE),
		}),
		Notifications.delete({
			isRead: true,
			createdAt: OlderThan(3 * MONTH),
		}),
		Users.delete({
			// delete users where the deletion status reference count has come down to zero
			isDeleted: 0,
		}),
	]);

	logger.succ('Deleted expired data.');

	done();
}
