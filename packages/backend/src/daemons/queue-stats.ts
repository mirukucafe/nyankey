import Xev from 'xev';
import { deliverQueue, inboxQueue } from '@/queue/queues.js';
import { SECOND } from '@/const.js';

const ev = new Xev();

const interval = 10 * SECOND;

/**
 * Report queue stats regularly
 */
export function queueStats(): void {
	const log: Record<string, Record<string, number>>[] = [];

	ev.on('requestQueueStatsLog', x => {
		ev.emit(`queueStatsLog:${x.id}`, log.slice(0, x.length || 50));
	});

	let activeDeliverJobs = 0;
	let activeInboxJobs = 0;

	deliverQueue.on('global:active', () => {
		activeDeliverJobs++;
	});

	inboxQueue.on('global:active', () => {
		activeInboxJobs++;
	});

	async function tick(): Promise<void> {
		const deliverJobCounts = await deliverQueue.getJobCounts();
		const inboxJobCounts = await inboxQueue.getJobCounts();

		const stats = {
			deliver: {
				activeSincePrevTick: activeDeliverJobs,
				active: deliverJobCounts.active,
				waiting: deliverJobCounts.waiting,
				delayed: deliverJobCounts.delayed,
			},
			inbox: {
				activeSincePrevTick: activeInboxJobs,
				active: inboxJobCounts.active,
				waiting: inboxJobCounts.waiting,
				delayed: inboxJobCounts.delayed,
			},
		};

		ev.emit('queueStats', stats);

		log.unshift(stats);
		if (log.length > 200) log.pop();

		activeDeliverJobs = 0;
		activeInboxJobs = 0;
	}

	tick();

	setInterval(tick, interval);
}
